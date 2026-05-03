import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo, calcPaymentStatus } from "@/lib/services/purchaseService";
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

const createSchema = z.object({
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
  status: z.enum(["PENDING", "ORDERED", "RECEIVED", "CANCELED"]).default("PENDING"),
  note: z.string().optional().nullable(),
  attachment: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const url = new URL(req.url);
  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;
  const status = url.searchParams.get("status") || undefined;
  const warehouseId = url.searchParams.get("warehouseId") || undefined;
  const supplierId = url.searchParams.get("supplierId") || undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { referenceNo: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;
  if (warehouseId) where.warehouseId = warehouseId;
  if (supplierId) where.supplierId = supplierId;

  const [data, total] = await Promise.all([
    user.db.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.purchase.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "purchase");
    const paymentStatus = calcPaymentStatus(parsed.grandTotal, parsed.paidAmount);

    const created = await user.db.purchase.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
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
      include: { items: true, supplier: true, warehouse: true },
    });

    return ok(created, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error: " + JSON.stringify(e.issues), 400);
    console.error("Purchase create error:", e);
    return error("Internal server error", 500);
  }
}
