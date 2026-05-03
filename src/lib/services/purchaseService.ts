import { prisma } from "@/lib/prisma";
import type { TenantPrismaClient } from "@/lib/prisma-tenant";

export async function generateReferenceNo(
  db: TenantPrismaClient,
  tenantId: string,
  type: "purchase" | "sale" | "return" | "transfer" | "quotation" | "expense" | "adjustment" | "stockCount" | "payment"
): Promise<string> {
  const settings = await db.systemSettings.findUnique({ where: { tenantId } });

  const prefixMap = {
    purchase: settings?.purchasePrefix || "PUR-",
    sale: settings?.salePrefix || "SALE-",
    return: settings?.returnPrefix || "RET-",
    transfer: settings?.transferPrefix || "TRF-",
    quotation: settings?.quotationPrefix || "QUO-",
    expense: settings?.expensePrefix || "EXP-",
    adjustment: settings?.adjustmentPrefix || "ADJ-",
    stockCount: settings?.stockCountPrefix || "SC-",
    payment: settings?.paymentPrefix || "PAY-",
  };

  const prefix = prefixMap[type];
  const counterMap = {
    purchase: () => db.purchase.count(),
    sale: () => db.sale.count(),
    return: () => db.return.count(),
    transfer: () => db.transfer.count(),
    quotation: () => db.quotation.count(),
    expense: () => db.expense.count(),
    adjustment: () => db.adjustment.count(),
    stockCount: () => db.stockCount.count(),
    payment: () => db.payment.count(),
  };

  const count = await counterMap[type]();
  return `${prefix}${(count + 1).toString().padStart(6, "0")}`;
}

export interface PurchaseItemInput {
  productId: string;
  productName: string;
  productCode: string;
  unitCost: number;
  quantity: number;
  receivedQty?: number;
  discount?: number;
  discountType?: "FIXED" | "PERCENTAGE";
  taxRate?: number;
  taxAmount?: number;
  subtotal: number;
  expiryDate?: string | null;
  batchNumber?: string | null;
}

export function calcPaymentStatus(grandTotal: number, paidAmount: number): "UNPAID" | "PARTIAL" | "PAID" {
  if (paidAmount <= 0) return "UNPAID";
  if (paidAmount >= grandTotal) return "PAID";
  return "PARTIAL";
}

/**
 * Apply stock changes for a purchase. Direction: +1 add stock, -1 remove stock.
 * Uses raw prisma client + transaction for atomicity.
 */
export async function applyPurchaseStock(
  tenantId: string,
  purchaseId: string,
  warehouseId: string,
  direction: 1 | -1
) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.purchaseItem.findMany({
      where: { purchaseId, tenantId },
    });

    for (const item of items) {
      const qty = Number(item.receivedQty) || Number(item.quantity);
      const delta = direction * qty;

      const stock = await tx.productWarehouseStock.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId } },
      });

      if (stock) {
        await tx.productWarehouseStock.update({
          where: { id: stock.id },
          data: { quantity: { increment: delta } },
        });
      } else {
        await tx.productWarehouseStock.create({
          data: {
            tenantId,
            productId: item.productId,
            warehouseId,
            quantity: delta,
          },
        });
      }
    }
  });
}
