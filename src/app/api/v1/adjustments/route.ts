import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().min(1),
  referenceNo: z.string().min(1).max(100),
  warehouseId: z.string().cuid(),
  type: z.enum(["ADDITION", "SUBTRACTION"]),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.coerce.number().positive(),
      })
    )
    .min(1, "At least one item is required"),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const url = new URL(req.url);
  const warehouseId = url.searchParams.get("warehouseId") || undefined;

  const where: any = {
    ...(search ? { referenceNo: { contains: search, mode: "insensitive" } } : {}),
    ...(warehouseId ? { warehouseId } : {}),
  };

  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.adjustment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        warehouse: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    user.db.adjustment.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { date, referenceNo, warehouseId, type, note, items } = createSchema.parse(body);

    // Check reference uniqueness
    const existing = await user.db.adjustment.findFirst({ where: { referenceNo } });
    if (existing) return error("Reference number already exists", 400);

    const adjustment = await user.db.$transaction(async (tx) => {
      const adj = await tx.adjustment.create({
        data: {
          date: new Date(date),
          referenceNo,
          warehouseId,
          type,
          note: note || null,
          items: {
            create: items.map((item) => ({
              tenantId: user.tenantId,
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, code: true } } } },
        },
      });

      // Update warehouse stock for each item
      for (const item of items) {
        const stock = await tx.productWarehouseStock.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } },
        });

        if (!stock) {
          await tx.productWarehouseStock.create({
            data: {
              tenantId: user.tenantId,
              productId: item.productId,
              warehouseId,
              quantity: type === "ADDITION" ? item.quantity : 0,
            },
          });
        } else {
          const delta = type === "ADDITION" ? item.quantity : -item.quantity;
          const newQty = Math.max(0, Number(stock.quantity) + delta);
          await tx.productWarehouseStock.update({
            where: { productId_warehouseId: { productId: item.productId, warehouseId } },
            data: { quantity: newQty },
          });
        }
      }

      return adj;
    });

    return ok(adjustment, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return error(err.issues[0]?.message || "Validation error", 400);
    console.error("Adjustment creation error:", err);
    return error("Internal server error", 500);
  }
}
