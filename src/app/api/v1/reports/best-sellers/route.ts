import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { rangeFromSearchParams } from "@/lib/utils/date-range";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const { from, to } = rangeFromSearchParams(url);
    const limit = Math.min(100, Math.max(5, parseInt(url.searchParams.get("limit") ?? "20")));

    const rows = await prisma.$queryRaw<
      Array<{
        productName: string;
        productCode: string;
        qty: number;
        revenue: number;
        orders: bigint;
      }>
    >`
      SELECT si."productName" AS "productName",
             si."productCode" AS "productCode",
             SUM(si.quantity)::float AS qty,
             SUM(si.subtotal)::float AS revenue,
             COUNT(DISTINCT si."saleId")::bigint AS orders
      FROM sale_items si
      JOIN sales s ON s.id = si."saleId"
      WHERE si."tenantId" = ${user.tenantId}
        AND s.date >= ${from}
        AND s.date <= ${to}
        AND s.status = 'COMPLETED'
      GROUP BY si."productName", si."productCode"
      ORDER BY qty DESC
      LIMIT ${limit}
    `;

    return ok({
      rows: rows.map((r) => ({
        productName: r.productName,
        productCode: r.productCode,
        qty: Number(r.qty),
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
    });
  } catch (e) {
    console.error("Best sellers report error:", e);
    return error("Internal server error", 500);
  }
}
