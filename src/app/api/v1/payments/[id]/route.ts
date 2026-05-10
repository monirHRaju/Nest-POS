import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { calcPaymentStatus } from "@/lib/services/purchaseService";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.payment.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    await user.db.payment.delete({ where: { id: (await params).id } });

    // Recalc parent
    if (existing.purchaseId) {
      const purchase = await user.db.purchase.findUnique({ where: { id: existing.purchaseId } });
      if (purchase) {
        const sums = await user.db.payment.aggregate({
          where: { purchaseId: existing.purchaseId },
          _sum: { amount: true },
        });
        const paid = Number(sums._sum.amount) || 0;
        await user.db.purchase.update({
          where: { id: existing.purchaseId },
          data: {
            paidAmount: paid,
            paymentStatus: calcPaymentStatus(Number(purchase.grandTotal), paid),
          },
        });
      }
    } else if (existing.saleId) {
      const sale = await user.db.sale.findUnique({ where: { id: existing.saleId } });
      if (sale) {
        const sums = await user.db.payment.aggregate({
          where: { saleId: existing.saleId },
          _sum: { amount: true },
        });
        const paid = Number(sums._sum.amount) || 0;
        await user.db.sale.update({
          where: { id: existing.saleId },
          data: {
            paidAmount: paid,
            paymentStatus: calcPaymentStatus(Number(sale.grandTotal), paid),
          },
        });
      }
    }

    return ok({ message: "Payment deleted" });
  } catch (e) {
    console.error("Payment delete error:", e);
    return error("Internal server error", 500);
  }
}
