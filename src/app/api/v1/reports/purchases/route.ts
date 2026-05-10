import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { rangeFromSearchParams } from "@/lib/utils/date-range";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const { from, to } = rangeFromSearchParams(url);
    const status = url.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = { date: { gte: from, lte: to } };
    if (status) where.status = status;

    const [rows, totals] = await Promise.all([
      user.db.purchase.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          supplier: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
      }),
      user.db.purchase.aggregate({
        where,
        _sum: { grandTotal: true, paidAmount: true },
        _count: { _all: true },
      }),
    ]);

    return ok({
      rows: rows.map((p) => ({
        id: p.id,
        date: p.date.toISOString(),
        referenceNo: p.referenceNo,
        supplier: p.supplier?.name ?? "—",
        warehouse: p.warehouse?.name ?? "—",
        status: p.status,
        paymentStatus: p.paymentStatus,
        grandTotal: Number(p.grandTotal),
        paidAmount: Number(p.paidAmount),
        due: Number(p.grandTotal) - Number(p.paidAmount),
      })),
      summary: {
        count: totals._count._all,
        grandTotal: Number(totals._sum.grandTotal ?? 0),
        paidAmount: Number(totals._sum.paidAmount ?? 0),
      },
    });
  } catch (e) {
    console.error("Purchases report error:", e);
    return error("Internal server error", 500);
  }
}
