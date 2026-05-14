import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo, calcPaymentStatus } from "@/lib/services/purchaseService";
import { applySaleStock, validateSaleStock } from "@/lib/services/saleService";
import { requireMutationAccess } from "@/lib/saas/limits";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productCode: z.string(),
  variantName: z.string().optional().nullable(),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  subtotal: z.number().min(0),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(["CASH", "CARD", "CHEQUE", "BANK_TRANSFER", "GIFT_CARD", "MOBILE_PAYMENT", "OTHER"]).default("CASH"),
  cardNumber: z.string().optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  transactionRef: z.string().optional().nullable(),
  giftCardId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

const createSchema = z.object({
  date: z.string().optional(),
  customerId: z.string().optional().nullable(),
  billerId: z.string().optional().nullable(),
  warehouseId: z.string().min(1),
  items: z.array(itemSchema).min(1),
  payments: z.array(paymentSchema).default([]),
  subtotal: z.number().min(0),
  orderTaxId: z.string().optional().nullable(),
  orderTaxAmount: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).default("FIXED"),
  discountAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  status: z.enum(["PENDING", "COMPLETED", "CANCELED"]).default("COMPLETED"),
  source: z.enum(["POS", "WEB", "API"]).default("POS"),
  note: z.string().optional().nullable(),
  staffNote: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const url = new URL(req.url);
  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;
  const status = url.searchParams.get("status") || undefined;
  const source = url.searchParams.get("source") || undefined;
  const customerId = url.searchParams.get("customerId") || undefined;
  const warehouseId = url.searchParams.get("warehouseId") || undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { referenceNo: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (status) where.status = status;
  if (source) where.source = source;
  if (customerId) where.customerId = customerId;
  if (warehouseId) where.warehouseId = warehouseId;

  const [data, total] = await Promise.all([
    user.db.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        biller: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.sale.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    // Subscription/trial gate
    const access = await requireMutationAccess(user.tenantId);
    if (!access.ok) return error(access.error!, access.status!);

    const body = await req.json();
    const parsed = createSchema.parse(body);

    // Stock validation (skip if status PENDING or system allows negative)
    if (parsed.status === "COMPLETED") {
      const settings = await user.db.systemSettings.findUnique({ where: { tenantId: user.tenantId } });
      const allowNegative = settings?.allowNegativeStock ?? false;
      try {
        await validateSaleStock(user.tenantId, parsed.warehouseId, parsed.items, allowNegative);
      } catch (e: any) {
        return error(e.message, 400);
      }
    }

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "sale");
    const totalPaid = parsed.payments.reduce((s, p) => s + p.amount, 0);
    const paymentStatus = calcPaymentStatus(parsed.grandTotal, totalPaid);

    const created = await user.db.sale.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        customerId: parsed.customerId || null,
        billerId: parsed.billerId || null,
        userId: user.id,
        warehouseId: parsed.warehouseId,
        subtotal: parsed.subtotal,
        orderTaxId: parsed.orderTaxId || null,
        orderTaxAmount: parsed.orderTaxAmount,
        discount: parsed.discount,
        discountType: parsed.discountType,
        discountAmount: parsed.discountAmount,
        shippingCost: parsed.shippingCost,
        grandTotal: parsed.grandTotal,
        paidAmount: totalPaid,
        status: parsed.status,
        paymentStatus,
        source: parsed.source,
        note: parsed.note,
        staffNote: parsed.staffNote,
        items: {
          create: parsed.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            variantName: it.variantName || null,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            discount: it.discount,
            discountType: it.discountType,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            subtotal: it.subtotal,
          })),
        },
        payments: parsed.payments.length > 0 ? {
          create: await Promise.all(parsed.payments.map(async (p) => ({
            tenantId: user.tenantId,
            referenceNo: await generateReferenceNo(user.db, user.tenantId, "payment"),
            date: new Date(),
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            cardNumber: p.cardNumber,
            chequeNumber: p.chequeNumber,
            bankName: p.bankName,
            transactionRef: p.transactionRef,
            giftCardId: p.giftCardId,
            note: p.note,
          }))),
        } : undefined,
      } as any,
      include: { items: true, payments: true, customer: true, warehouse: true },
    });

    // Decrement stock if completed
    if (parsed.status === "COMPLETED") {
      await applySaleStock(user.tenantId, created.id, parsed.warehouseId, -1);
    }

    return ok(created, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error: " + JSON.stringify(e.issues), 400);
    console.error("Sale create error:", e);
    return error("Internal server error", 500);
  }
}
