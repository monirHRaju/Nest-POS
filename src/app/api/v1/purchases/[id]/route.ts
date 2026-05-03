import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { applyPurchaseStock, calcPaymentStatus } from "@/lib/services/purchaseService";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productCode: z.string(),
  unitCost: z.number().min(0),
  quantity: z.number().positive(),
  receivedQty: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  subtotal: z.number().min(0),
  expiryDate: z.string().nullable().optional(),
  batchNumber: z.string().nullable().optional(),
});

const updateSchema = z.object({
  date: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  warehouseId: z.string().min(1),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().min(0),
  orderTaxId: z.string().optional().nullable(),
  orderTaxAmount: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
  discountAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  status: z.enum(["PENDING", "ORDERED", "RECEIVED", "CANCELED"]),
  note: z.string().optional().nullable(),
  attachment: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.purchase.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      supplier: true,
      warehouse: true,
      orderTax: true,
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await user.db.purchase.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    if (existing.status === "RECEIVED" && parsed.status !== "RECEIVED" && parsed.status !== "CANCELED") {
      return error("Cannot revert RECEIVED to non-canceled state", 400);
    }
    if (existing.status === "RECEIVED" && parsed.status === "CANCELED") {
      // Reverse stock
      await applyPurchaseStock(user.tenantId, params.id, existing.warehouseId, -1);
    }

    const wasReceived = existing.status === "RECEIVED";
    const willBeReceived = parsed.status === "RECEIVED";
    const paymentStatus = calcPaymentStatus(parsed.grandTotal, parsed.paidAmount);

    // Replace items: delete + recreate
    await user.db.purchaseItem.deleteMany({ where: { purchaseId: params.id } });

    const updated = await user.db.purchase.update({
      where: { id: params.id },
      data: {
        date: parsed.date ? new Date(parsed.date) : existing.date,
        supplierId: parsed.supplierId || null,
        warehouseId: parsed.warehouseId,
        subtotal: parsed.subtotal,
        orderTaxId: parsed.orderTaxId || null,
        orderTaxAmount: parsed.orderTaxAmount,
        discount: parsed.discount,
        discountType: parsed.discountType,
        discountAmount: parsed.discountAmount,
        shippingCost: parsed.shippingCost,
        grandTotal: parsed.grandTotal,
        paidAmount: parsed.paidAmount,
        status: parsed.status,
        paymentStatus,
        note: parsed.note,
        attachment: parsed.attachment,
        items: {
          create: parsed.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            unitCost: it.unitCost,
            quantity: it.quantity,
            receivedQty: it.receivedQty,
            discount: it.discount,
            discountType: it.discountType,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            subtotal: it.subtotal,
            expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
            batchNumber: it.batchNumber || null,
          })),
        },
      } as any,
      include: { items: true },
    });

    // Apply stock if transitioning to RECEIVED
    if (!wasReceived && willBeReceived) {
      await applyPurchaseStock(user.tenantId, params.id, parsed.warehouseId, 1);
    }

    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Purchase update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.purchase.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    if (existing.status === "RECEIVED") {
      return error("Cannot delete RECEIVED purchase. Cancel first to reverse stock.", 400);
    }

    const paymentsCount = await user.db.payment.count({ where: { purchaseId: params.id } });
    if (paymentsCount > 0) {
      return error(`Cannot delete: ${paymentsCount} payment(s) recorded`, 400);
    }

    await user.db.purchase.delete({ where: { id: params.id } });
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    console.error("Purchase delete error:", e);
    return error("Internal server error", 500);
  }
}
