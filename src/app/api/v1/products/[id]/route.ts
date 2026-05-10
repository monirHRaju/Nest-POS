import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  type: z.enum(["STANDARD", "DIGITAL", "SERVICE", "COMBO"]).default("STANDARD"),
  barcodeSymbology: z.string().default("CODE128"),
  categoryId: z.string().cuid().optional().nullable(),
  brandId: z.string().cuid().optional().nullable(),
  unitId: z.string().cuid().optional().nullable(),
  taxId: z.string().cuid().optional().nullable(),
  taxMethod: z.enum(["INCLUSIVE", "EXCLUSIVE"]).default("EXCLUSIVE"),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  minimumPrice: z.coerce.number().min(0).optional().nullable(),
  alertQuantity: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  hasVariants: z.boolean().default(false),
  hasSerialNumber: z.boolean().default(false),
  isBatchTracking: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const productIncludes = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, shortName: true } },
  tax: { select: { id: true, name: true, rate: true } },
  warehouseStocks: {
    include: { warehouse: { select: { id: true, name: true } } },
  },
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const product = await user.db.product.findUnique({
    where: { id: (await params).id },
    include: productIncludes,
  });

  if (!product) return error("Product not found", 404);

  return ok({
    ...product,
    totalStock: product.warehouseStocks.reduce((sum, s) => sum + Number(s.quantity), 0),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await user.db.product.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Product not found", 404);

    // Check code uniqueness (exclude self)
    if (data.code !== existing.code) {
      const conflict = await user.db.product.findFirst({ where: { code: data.code } });
      if (conflict) return error("Product code already exists", 400);
    }

    const updated = await user.db.product.update({
      where: { id: (await params).id },
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        barcodeSymbology: data.barcodeSymbology,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        unitId: data.unitId || null,
        taxId: data.taxId || null,
        taxMethod: data.taxMethod,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice ?? null,
        minimumPrice: data.minimumPrice ?? null,
        alertQuantity: data.alertQuantity,
        description: data.description || null,
        image: data.image || null,
        images: data.images,
        hasVariants: data.hasVariants,
        hasSerialNumber: data.hasSerialNumber,
        isBatchTracking: data.isBatchTracking,
        isActive: data.isActive,
      },
      include: productIncludes,
    });

    return ok({
      ...updated,
      totalStock: updated.warehouseStocks.reduce((sum, s) => sum + Number(s.quantity), 0),
    });
  } catch (err) {
    if (err instanceof z.ZodError) return error(err.issues[0]?.message || "Validation error", 400);
    console.error("Product update error:", err);
    return error("Internal server error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const product = await user.db.product.findUnique({
      where: { id: (await params).id },
      include: { warehouseStocks: { select: { quantity: true } } },
    });

    if (!product) return error("Product not found", 404);

    const hasStock = product.warehouseStocks.some((s) => Number(s.quantity) > 0);
    if (hasStock) {
      return error("Cannot delete product with existing stock. Adjust stock to zero first.", 400);
    }

    await user.db.product.delete({ where: { id: (await params).id } });
    return ok({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Product deletion error:", err);
    return error("Internal server error", 500);
  }
}
