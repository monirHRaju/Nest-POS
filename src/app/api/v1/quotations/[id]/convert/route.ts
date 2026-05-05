import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { generateReferenceNo, calcPaymentStatus } from "@/lib/services/purchaseService";
import { applySaleStock, validateSaleStock } from "@/lib/services/saleService";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const quotation = await user.db.quotation.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!quotation) return error("Not found", 404);
    if (quotation.status === "CONVERTED") return error("Already converted", 400);
    if (!quotation.warehouseId) return error("Quotation has no warehouse — cannot convert", 400);

    // Validate stock
    const settings = await user.db.systemSettings.findUnique({ where: { tenantId: user.tenantId } });
    const allowNegative = settings?.allowNegativeStock ?? false;
    try {
      await validateSaleStock(
        user.tenantId,
        quotation.warehouseId,
        quotation.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: Number(it.quantity),
        })),
        allowNegative
      );
    } catch (e: any) {
      return error(e.message, 400);
    }

    const referenceNo = await generateReferenceNo(user.db, user.tenantId, "sale");

    const sale = await user.db.sale.create({
      data: {
        referenceNo,
        date: new Date(),
        customerId: quotation.customerId,
        userId: user.id,
        warehouseId: quotation.warehouseId,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        discountType: quotation.discountType,
        discountAmount: quotation.discountAmount,
        grandTotal: quotation.grandTotal,
        paidAmount: 0,
        status: "COMPLETED",
        paymentStatus: calcPaymentStatus(Number(quotation.grandTotal), 0),
        source: "WEB",
        note: `Converted from quotation ${quotation.referenceNo}`,
        items: {
          create: quotation.items.map((it) => ({
            tenantId: user.tenantId,
            productId: it.productId,
            productName: it.productName,
            productCode: it.productCode,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            subtotal: it.subtotal,
          })),
        },
      } as any,
      include: { items: true },
    });

    // Decrement stock
    await applySaleStock(user.tenantId, sale.id, quotation.warehouseId, -1);

    // Mark quotation converted
    await user.db.quotation.update({
      where: { id: params.id },
      data: { status: "CONVERTED" },
    });

    return ok({ saleId: sale.id, referenceNo: sale.referenceNo, message: "Converted to sale" });
  } catch (e) {
    console.error("Quotation convert error:", e);
    return error("Internal server error", 500);
  }
}
