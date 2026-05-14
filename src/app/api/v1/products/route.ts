import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { checkPlanLimit, requireMutationAccess } from "@/lib/saas/limits";
import { z } from "zod";

const createSchema = z.object({
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
  warehouseStocks: { select: { quantity: true } },
};

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const brandId = url.searchParams.get("brandId") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const isActiveParam = url.searchParams.get("isActive");
  const isActive = isActiveParam === null ? undefined : isActiveParam === "true";

  const where: any = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
    ...(type ? { type: type as any } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const skip = (page - 1) * pageSize;

  const [products, total] = await Promise.all([
    user.db.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: productIncludes,
    }),
    user.db.product.count({ where }),
  ]);

  const data = products.map((p) => ({
    ...p,
    totalStock: p.warehouseStocks.reduce((sum, s) => sum + Number(s.quantity), 0),
  }));

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Subscription/trial gate
    const access = await requireMutationAccess(user.tenantId);
    if (!access.ok) return error(access.error!, access.status!);

    // Plan limit check
    const limitErr = await checkPlanLimit(user.tenantId, "products");
    if (limitErr) return error(limitErr, 400);

    // Check code uniqueness
    const existing = await user.db.product.findFirst({ where: { code: data.code } });
    if (existing) return error("Product code already exists", 400);

    // Create product + initialize warehouse stocks in a transaction
    const product = await user.db.$transaction(async (tx) => {
      const created = await tx.product.create({
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

      // Initialize stock for all tenant warehouses
      const warehouses = await tx.warehouse.findMany({ select: { id: true } });
      if (warehouses.length > 0) {
        await tx.productWarehouseStock.createMany({
          data: warehouses.map((w) => ({
            tenantId: user.tenantId,
            productId: created.id,
            warehouseId: w.id,
            quantity: 0,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return ok({ ...product, totalStock: 0 }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return error(err.issues[0]?.message || "Validation error", 400);
    console.error("Product creation error:", err);
    return error("Internal server error", 500);
  }
}
