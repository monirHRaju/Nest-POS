import { prisma } from "@/lib/prisma";

/**
 * Apply stock changes for a sale. Direction: -1 decrement (sell), +1 increment (return/cancel).
 */
export async function applySaleStock(
  tenantId: string,
  saleId: string,
  warehouseId: string,
  direction: 1 | -1
) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.saleItem.findMany({
      where: { saleId, tenantId },
    });

    for (const item of items) {
      const delta = direction * Number(item.quantity);

      const stock = await tx.productWarehouseStock.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId } },
      });

      if (stock) {
        await tx.productWarehouseStock.update({
          where: { id: stock.id },
          data: { quantity: { increment: delta } },
        });
      } else if (delta > 0) {
        await tx.productWarehouseStock.create({
          data: { tenantId, productId: item.productId, warehouseId, quantity: delta },
        });
      }
    }
  });
}

/**
 * Validate stock availability for a sale. Throws if insufficient.
 * allowNegative: from system settings — skips check if true.
 */
export async function validateSaleStock(
  tenantId: string,
  warehouseId: string,
  items: Array<{ productId: string; productName: string; quantity: number }>,
  allowNegative: boolean
) {
  if (allowNegative) return;

  for (const item of items) {
    const stock = await prisma.productWarehouseStock.findUnique({
      where: { productId_warehouseId: { productId: item.productId, warehouseId } },
    });
    const available = stock ? Number(stock.quantity) : 0;
    if (available < item.quantity) {
      throw new Error(`Insufficient stock for "${item.productName}": available ${available}, requested ${item.quantity}`);
    }
  }
}
