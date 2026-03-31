import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  type: z.enum(["STANDARD", "DIGITAL", "SERVICE", "COMBO"]).default("STANDARD"),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  alertQuantity: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const rows: any[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return error("No rows provided", 400);
    }

    // Load lookup data for category/brand/unit matching
    const [categories, brands, units, warehouses] = await Promise.all([
      user.db.category.findMany({ select: { id: true, name: true } }),
      user.db.brand.findMany({ select: { id: true, name: true } }),
      user.db.unit.findMany({ select: { id: true, name: true, shortName: true } }),
      user.db.warehouse.findMany({ select: { id: true } }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
    const unitMap = new Map([
      ...units.map((u) => [u.name.toLowerCase(), u.id] as [string, string]),
      ...units.map((u) => [u.shortName.toLowerCase(), u.id] as [string, string]),
    ]);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed + header row
      try {
        const row = rowSchema.parse(rows[i]);

        // Check code conflict
        const conflict = await user.db.product.findFirst({ where: { code: row.code } });
        if (conflict) {
          skipped++;
          errors.push(`Row ${rowNum}: Code "${row.code}" already exists — skipped`);
          continue;
        }

        const categoryId = row.category ? categoryMap.get(row.category.toLowerCase()) || null : null;
        const brandId = row.brand ? brandMap.get(row.brand.toLowerCase()) || null : null;
        const unitId = row.unit ? unitMap.get(row.unit.toLowerCase()) || null : null;

        await user.db.$transaction(async (tx) => {
          const product = await tx.product.create({
            data: {
              name: row.name,
              code: row.code,
              type: row.type,
              categoryId,
              brandId,
              unitId,
              costPrice: row.costPrice,
              sellingPrice: row.sellingPrice,
              alertQuantity: row.alertQuantity,
              description: row.description || null,
            },
          });

          if (warehouses.length > 0) {
            await tx.productWarehouseStock.createMany({
              data: warehouses.map((w) => ({
                tenantId: user.tenantId,
                productId: product.id,
                warehouseId: w.id,
                quantity: 0,
              })),
              skipDuplicates: true,
            });
          }
        });

        imported++;
      } catch (err) {
        skipped++;
        if (err instanceof z.ZodError) {
          errors.push(`Row ${rowNum}: ${err.issues[0]?.message || "Validation error"}`);
        } else {
          errors.push(`Row ${rowNum}: Import failed`);
        }
      }
    }

    return ok({ imported, skipped, errors });
  } catch (err) {
    console.error("Product import error:", err);
    return error("Internal server error", 500);
  }
}
