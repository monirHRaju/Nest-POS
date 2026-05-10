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

    const rows = await prisma.$queryRaw<
      Array<{
        customerId: string | null;
        name: string;
        phone: string | null;
        email: string | null;
        orders: bigint;
        totalAmount: number;
        paidAmount: number;
        dueAmount: number;
      }>
    >`
      SELECT c.id AS "customerId",
             COALESCE(c.name, 'Walk-in') AS name,
             c.phone AS phone,
             c.email AS email,
             COUNT(s.id)::bigint AS orders,
             COALESCE(SUM(s."grandTotal"), 0)::float AS "totalAmount",
             COALESCE(SUM(s."paidAmount"), 0)::float AS "paidAmount",
             COALESCE(SUM(s."grandTotal" - s."paidAmount"), 0)::float AS "dueAmount"
      FROM sales s
      LEFT JOIN customers c ON c.id = s."customerId"
      WHERE s."tenantId" = ${user.tenantId}
        AND s.date >= ${from}
        AND s.date <= ${to}
        AND s.status = 'COMPLETED'
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY "totalAmount" DESC
    `;

    return ok({
      rows: rows.map((r) => ({
        customerId: r.customerId,
        name: r.name,
        phone: r.phone ?? "",
        email: r.email ?? "",
        orders: Number(r.orders),
        totalAmount: Number(r.totalAmount),
        paidAmount: Number(r.paidAmount),
        dueAmount: Number(r.dueAmount),
      })),
    });
  } catch (e) {
    console.error("Customers report error:", e);
    return error("Internal server error", 500);
  }
}
