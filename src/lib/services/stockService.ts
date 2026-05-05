import { prisma } from "@/lib/prisma";

/**
 * Apply return stock change. Direction: +1 add (return received), -1 reverse (return cancel).
 */
export async function applyReturnStock(
  tenantId: string,
  returnId: string,
  warehouseId: string,
  direction: 1 | -1
) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.returnItem.findMany({ where: { returnId, tenantId } });
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
 * Apply transfer between warehouses. Direction: 1 = move from→to, -1 = reverse (to→from).
 */
export async function applyTransferStock(
  tenantId: string,
  transferId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  direction: 1 | -1
) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.transferItem.findMany({ where: { transferId, tenantId } });
    for (const item of items) {
      const qty = Number(item.quantity);
      const fromDelta = direction * -qty;
      const toDelta = direction * qty;

      // From warehouse
      const fromStock = await tx.productWarehouseStock.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: fromWarehouseId } },
      });
      if (fromStock) {
        await tx.productWarehouseStock.update({
          where: { id: fromStock.id },
          data: { quantity: { increment: fromDelta } },
        });
      }

      // To warehouse
      const toStock = await tx.productWarehouseStock.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: toWarehouseId } },
      });
      if (toStock) {
        await tx.productWarehouseStock.update({
          where: { id: toStock.id },
          data: { quantity: { increment: toDelta } },
        });
      } else if (toDelta > 0) {
        await tx.productWarehouseStock.create({
          data: { tenantId, productId: item.productId, warehouseId: toWarehouseId, quantity: toDelta },
        });
      }
    }
  });
}
