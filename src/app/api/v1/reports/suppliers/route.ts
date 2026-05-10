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
        supplierId: string | null;
        name: string;
        phone: string | null;
        email: string | null;
        purchases: bigint;
        totalAmount: number;
        paidAmount: number;
        dueAmount: number;
      }>
    >`
      SELECT s.id AS "supplierId",
             COALESCE(s.name, 'No Supplier') AS name,
             s.phone AS phone,
             s.email AS email,
             COUNT(p.id)::bigint AS purchases,
             COALESCE(SUM(p."grandTotal"), 0)::float AS "totalAmount",
             COALESCE(SUM(p."paidAmount"), 0)::float AS "paidAmount",
             COALESCE(SUM(p."grandTotal" - p."paidAmount"), 0)::float AS "dueAmount"
      FROM purchases p
      LEFT JOIN suppliers s ON s.id = p."supplierId"
      WHERE p."tenantId" = ${user.tenantId}
        AND p.date >= ${from}
        AND p.date <= ${to}
      GROUP BY s.id, s.name, s.phone, s.email
      ORDER BY "totalAmount" DESC
    `;

    return ok({
      rows: rows.map((r) => ({
        supplierId: r.supplierId,
        name: r.name,
        phone: r.phone ?? "",
        email: r.email ?? "",
        purchases: Number(r.purchases),
        totalAmount: Number(r.totalAmount),
        paidAmount: Number(r.paidAmount),
        dueAmount: Number(r.dueAmount),
      })),
    });
  } catch (e) {
    console.error("Suppliers report error:", e);
    return error("Internal server error", 500);
  }
}
