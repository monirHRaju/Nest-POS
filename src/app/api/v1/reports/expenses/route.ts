import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { rangeFromSearchParams } from "@/lib/utils/date-range";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const { from, to } = rangeFromSearchParams(url);
    const categoryId = url.searchParams.get("categoryId") || undefined;

    const where: Record<string, unknown> = { date: { gte: from, lte: to } };
    if (categoryId) where.categoryId = categoryId;

    const categoryFilter = categoryId
      ? Prisma.sql`AND e."categoryId" = ${categoryId}`
      : Prisma.empty;

    const [rows, totals, byCategory] = await Promise.all([
      user.db.expense.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          category: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
      }),
      user.db.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ name: string; total: number }>>(Prisma.sql`
        SELECT ec.name, COALESCE(SUM(e.amount), 0)::float AS total
        FROM expenses e
        JOIN expense_categories ec ON ec.id = e."categoryId"
        WHERE e."tenantId" = ${user.tenantId}
          AND e.date >= ${from}
          AND e.date <= ${to}
          ${categoryFilter}
        GROUP BY ec.name
        ORDER BY total DESC
      `),
    ]);

    return ok({
      rows: rows.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        referenceNo: e.referenceNo,
        category: e.category?.name ?? "—",
        warehouse: e.warehouse?.name ?? "—",
        amount: Number(e.amount),
        note: e.note ?? "",
      })),
      summary: {
        count: totals._count._all,
        total: Number(totals._sum.amount ?? 0),
      },
      byCategory: byCategory.map((c) => ({ name: c.name, total: Number(c.total) })),
    });
  } catch (e) {
    console.error("Expenses report error:", e);
    return error("Internal server error", 500);
  }
}
