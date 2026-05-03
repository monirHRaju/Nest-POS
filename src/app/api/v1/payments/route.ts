import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { generateReferenceNo, calcPaymentStatus } from "@/lib/services/purchaseService";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().optional(),
  saleId: z.string().optional().nullable(),
  purchaseId: z.string().optional().nullable(),
  returnId: z.string().optional().nullable(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["CASH", "CARD", "CHEQUE", "BANK_TRANSFER", "GIFT_CARD", "MOBILE_PAYMENT", "OTHER"]).default("CASH"),
  cardNumber: z.string().optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  transactionRef: z.string().optional().nullable(),
  giftCardId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const url = new URL(req.url);
  const { page, pageSize } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;
  const purchaseId = url.searchParams.get("purchaseId") || undefined;
  const saleId = url.searchParams.get("saleId") || undefined;
  const returnId = url.searchParams.get("returnId") || undefined;

  const where: any = {};
  if (purchaseId) where.purchaseId = purchaseId;
  if (saleId) where.saleId = saleId;
  if (returnId) where.returnId = returnId;

  const [data, total] = await Promise.all([
    user.db.payment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { date: "desc" },
    }),
    user.db.payment.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const linkedCount = [parsed.saleId, parsed.purchaseId, parsed.returnId].filter(Boolean).length;
    if (linkedCount !== 1) return error("Payment must link to exactly one of: sale, purchase, return", 400);

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "payment");

    const payment = await user.db.payment.create({
      data: {
        referenceNo,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        saleId: parsed.saleId || null,
        purchaseId: parsed.purchaseId || null,
        returnId: parsed.returnId || null,
        amount: parsed.amount,
        paymentMethod: parsed.paymentMethod,
        cardNumber: parsed.cardNumber,
        chequeNumber: parsed.chequeNumber,
        bankName: parsed.bankName,
        transactionRef: parsed.transactionRef,
        giftCardId: parsed.giftCardId,
        note: parsed.note,
      } as any,
    });

    // Recalc paidAmount + paymentStatus on parent
    if (parsed.purchaseId) {
      const purchase = await user.db.purchase.findUnique({ where: { id: parsed.purchaseId } });
      if (purchase) {
        const sums = await user.db.payment.aggregate({
          where: { purchaseId: parsed.purchaseId },
          _sum: { amount: true },
        });
        const paid = Number(sums._sum.amount) || 0;
        await user.db.purchase.update({
          where: { id: parsed.purchaseId },
          data: {
            paidAmount: paid,
            paymentStatus: calcPaymentStatus(Number(purchase.grandTotal), paid),
          },
        });
      }
    } else if (parsed.saleId) {
      const sale = await user.db.sale.findUnique({ where: { id: parsed.saleId } });
      if (sale) {
        const sums = await user.db.payment.aggregate({
          where: { saleId: parsed.saleId },
          _sum: { amount: true },
        });
        const paid = Number(sums._sum.amount) || 0;
        await user.db.sale.update({
          where: { id: parsed.saleId },
          data: {
            paidAmount: paid,
            paymentStatus: calcPaymentStatus(Number(sale.grandTotal), paid),
          },
        });
      }
    }

    return ok(payment, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Payment create error:", e);
    return error("Internal server error", 500);
  }
}
