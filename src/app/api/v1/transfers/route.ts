import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo } from "@/lib/services/purchaseService";
import { applyTransferStock } from "@/lib/services/stockService";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productCode: z.string(),
  unitCost: z.number().min(0),
  quantity: z.number().positive(),
  subtotal: z.number().min(0),
});

const createSchema = z.object({
  date: z.string().optional(),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  items: z.array(itemSchema).min(1),
  shippingCost: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  status: z.enum(["PENDING", "SENT", "COMPLETED", "CANCELED"]).default("PENDING"),
  note: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (search) {
    where.referenceNo = { contains: search, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    user.db.transfer.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.transfer.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    if (parsed.fromWarehouseId === parsed.toWarehouseId) {
      return error("Source and destination warehouse must differ", 400);
    }

    // Validate stock at source
    if (parsed.status === "COMPLETED" || parsed.status === "SENT") {
      for (const item of parsed.items) {
        const stock = await prisma.productWarehouseStock.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: parsed.fromWarehouseId } },
        });
        const available = stock ? Number(stock.quantity) : 0;
        if (available < item.quantity) {
          return error(`Insufficient stock for "${item.productName}" at source: available ${available}, requested ${item.quantity}`, 400);
        }
      }
    }

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "transfer");

    const created = await user.db.transfer.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        fromWarehouseId: parsed.fromWarehouseId,
        toWarehouseId: parsed.toWarehouseId,
        shippingCost: parsed.shippingCost,
        grandTotal: parsed.grandTotal,
        status: parsed.status,
        note: parsed.note,
        items: {
          create: parsed.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            unitCost: it.unitCost,
            quantity: it.quantity,
            subtotal: it.subtotal,
          })),
        },
      } as any,
      include: { items: true },
    });

    if (parsed.status === "COMPLETED") {
      await applyTransferStock(user.tenantId, created.id, parsed.fromWarehouseId, parsed.toWarehouseId, 1);
    }

    return ok(created, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error: " + JSON.stringify(e.issues), 400);
    console.error("Transfer create error:", e);
    return error("Internal server error", 500);
  }
}
