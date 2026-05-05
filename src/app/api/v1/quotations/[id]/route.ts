import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productCode: z.string(),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  subtotal: z.number().min(0),
});

const updateSchema = z.object({
  date: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
  discountAmount: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  status: z.enum(["PENDING", "SENT", "ACCEPTED", "REJECTED", "CONVERTED", "EXPIRED"]),
  note: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.quotation.findUnique({
    where: { id: params.id },
    include: { items: true, customer: true },
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

    const existing = await user.db.quotation.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    await user.db.quotationItem.deleteMany({ where: { quotationId: params.id } });

    const updated = await user.db.quotation.update({
      where: { id: params.id },
      data: {
        date: parsed.date ? new Date(parsed.date) : existing.date,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
        customerId: parsed.customerId || null,
        warehouseId: parsed.warehouseId || null,
        subtotal: parsed.subtotal,
        discount: parsed.discount,
        discountType: parsed.discountType,
        discountAmount: parsed.discountAmount,
        grandTotal: parsed.grandTotal,
        status: parsed.status,
        note: parsed.note,
        items: {
          create: parsed.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            discount: it.discount,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            subtotal: it.subtotal,
          })),
        },
      } as any,
      include: { items: true },
    });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Quotation update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.quotation.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);
    if (existing.status === "CONVERTED") return error("Cannot delete converted quotation", 400);
    await user.db.quotation.delete({ where: { id: params.id } });
    return ok({ message: "Deleted" });
  } catch (e) {
    console.error("Quotation delete error:", e);
    return error("Internal server error", 500);
  }
}
