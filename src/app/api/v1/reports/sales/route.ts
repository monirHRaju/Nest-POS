import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { rangeFromSearchParams } from "@/lib/utils/date-range";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const { from, to } = rangeFromSearchParams(url);
    const warehouseId = url.searchParams.get("warehouseId") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {
      date: { gte: from, lte: to },
    };
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    const [rows, totals] = await Promise.all([
      user.db.sale.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          customer: { select: { name: true } },
          warehouse: { select: { name: true } },
          biller: { select: { name: true } },
        },
      }) as Promise<Array<Record<string, any>>>,
      user.db.sale.aggregate({
        where,
        _sum: { grandTotal: true, paidAmount: true },
        _count: { _all: true },
      }),
    ]);

    return ok({
      rows: rows.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        referenceNo: s.referenceNo,
        customer: s.customer?.name ?? "Walk-in",
        warehouse: s.warehouse?.name ?? "—",
        biller: s.biller?.name ?? "—",
        status: s.status,
        paymentStatus: s.paymentStatus,
        grandTotal: Number(s.grandTotal),
        paidAmount: Number(s.paidAmount),
        due: Number(s.grandTotal) - Number(s.paidAmount),
      })),
      summary: {
        count: totals._count._all,
        grandTotal: Number(totals._sum.grandTotal ?? 0),
        paidAmount: Number(totals._sum.paidAmount ?? 0),
      },
    });
  } catch (e) {
    console.error("Sales report error:", e);
    return error("Internal server error", 500);
  }
}
