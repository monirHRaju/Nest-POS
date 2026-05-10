import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const warehouseId = url.searchParams.get("warehouseId") || "";
    const lowOnly = url.searchParams.get("lowOnly") === "1";

    const filters: Prisma.Sql[] = [Prisma.sql`p."tenantId" = ${user.tenantId}`, Prisma.sql`p."isActive" = true`];
    if (warehouseId) filters.push(Prisma.sql`pws."warehouseId" = ${warehouseId}`);

    const where = Prisma.join(filters, " AND ");

    const rows = await prisma.$queryRaw<
      Array<{
        productId: string;
        productName: string;
        productCode: string;
        warehouseName: string;
        quantity: number;
        costPrice: number;
        sellingPrice: number;
        alertQuantity: number;
        stockValue: number;
      }>
    >(Prisma.sql`
      SELECT p.id AS "productId",
             p.name AS "productName",
             p.code AS "productCode",
             w.name AS "warehouseName",
             COALESCE(pws.quantity, 0)::float AS quantity,
             p."costPrice"::float AS "costPrice",
             p."sellingPrice"::float AS "sellingPrice",
             p."alertQuantity"::float AS "alertQuantity",
             (COALESCE(pws.quantity, 0) * p."costPrice")::float AS "stockValue"
      FROM products p
      LEFT JOIN product_warehouse_stocks pws ON pws."productId" = p.id
      LEFT JOIN warehouses w ON w.id = pws."warehouseId"
      WHERE ${where}
      ORDER BY p.name ASC, w.name ASC
    `);

    const filtered = lowOnly
      ? rows.filter((r) => Number(r.alertQuantity) > 0 && Number(r.quantity) <= Number(r.alertQuantity))
      : rows;

    const totalQty = filtered.reduce((s, r) => s + Number(r.quantity), 0);
    const totalValue = filtered.reduce((s, r) => s + Number(r.stockValue), 0);

    return ok({
      rows: filtered,
      summary: { count: filtered.length, totalQty, totalValue },
    });
  } catch (e) {
    console.error("Stock report error:", e);
    return error("Internal server error", 500);
  }
}
