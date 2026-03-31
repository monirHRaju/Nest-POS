import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
      countedQty: z.coerce.number().min(0),
    })
  ),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const stockCount = await user.db.stockCount.findUnique({
    where: { id: params.id },
    include: {
      warehouse: { select: { id: true, name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: { select: { shortName: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!stockCount) return error("Stock count not found", 404);
  return ok(stockCount);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { action } = body;

    const stockCount = await user.db.stockCount.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!stockCount) return error("Stock count not found", 404);
    if (stockCount.status === "COMPLETED") return error("Stock count is already finalized", 400);

    // Update counted quantities
    if (action === "update_items") {
      const { items } = updateItemsSchema.parse(body);

      await user.db.$transaction(async (tx) => {
        for (const item of items) {
          await tx.stockCountItem.update({
            where: { id: item.id },
            data: {
              countedQty: item.countedQty,
              difference: item.countedQty - Number(
                stockCount.items.find((i) => i.id === item.id)?.expectedQty ?? 0
              ),
            },
          });
        }

        await tx.stockCount.update({
          where: { id: params.id },
          data: { status: "IN_PROGRESS" },
        });
      });

      return ok({ message: "Items updated" });
    }

    // Finalize: generate adjustment + mark completed
    if (action === "finalize") {
      const freshItems = await user.db.stockCountItem.findMany({
        where: { stockCountId: params.id },
      });

      const discrepancies = freshItems.filter(
        (item) => item.countedQty !== null && Number(item.countedQty) !== Number(item.expectedQty)
      );

      await user.db.$transaction(async (tx) => {
        // Update differences for all items
        for (const item of freshItems) {
          if (item.countedQty !== null) {
            await tx.stockCountItem.update({
              where: { id: item.id },
              data: { difference: Number(item.countedQty) - Number(item.expectedQty) },
            });
          }
        }

        // Create adjustment records for discrepancies
        if (discrepancies.length > 0) {
          const additions = discrepancies.filter(
            (d) => d.countedQty !== null && Number(d.countedQty) > Number(d.expectedQty)
          );
          const subtractions = discrepancies.filter(
            (d) => d.countedQty !== null && Number(d.countedQty) < Number(d.expectedQty)
          );

          const refBase = `SC-ADJ-${stockCount.referenceNo}`;

          if (additions.length > 0) {
            await tx.adjustment.create({
              data: {
                tenantId: user.tenantId,
                referenceNo: `${refBase}-ADD`,
                date: new Date(),
                warehouseId: stockCount.warehouseId,
                type: "ADDITION",
                note: `Stock count reconciliation: ${stockCount.referenceNo}`,
                items: {
                  create: additions.map((d) => ({
                    tenantId: user.tenantId,
                    productId: d.productId,
                    quantity: Number(d.countedQty) - Number(d.expectedQty),
                  })),
                },
              },
            });

            // Update stock
            for (const d of additions) {
              await tx.productWarehouseStock.updateMany({
                where: { productId: d.productId, warehouseId: stockCount.warehouseId },
                data: { quantity: Number(d.countedQty) },
              });
            }
          }

          if (subtractions.length > 0) {
            await tx.adjustment.create({
              data: {
                tenantId: user.tenantId,
                referenceNo: `${refBase}-SUB`,
                date: new Date(),
                warehouseId: stockCount.warehouseId,
                type: "SUBTRACTION",
                note: `Stock count reconciliation: ${stockCount.referenceNo}`,
                items: {
                  create: subtractions.map((d) => ({
                    tenantId: user.tenantId,
                    productId: d.productId,
                    quantity: Number(d.expectedQty) - Number(d.countedQty),
                  })),
                },
              },
            });

            // Update stock
            for (const d of subtractions) {
              await tx.productWarehouseStock.updateMany({
                where: { productId: d.productId, warehouseId: stockCount.warehouseId },
                data: { quantity: Number(d.countedQty) },
              });
            }
          }
        }

        // Mark completed
        await tx.stockCount.update({
          where: { id: params.id },
          data: { status: "COMPLETED" },
        });
      });

      return ok({ message: "Stock count finalized", adjustmentsCreated: discrepancies.length > 0 });
    }

    return error("Invalid action", 400);
  } catch (err) {
    if (err instanceof z.ZodError) return error(err.issues[0]?.message || "Validation error", 400);
    console.error("Stock count update error:", err);
    return error("Internal server error", 500);
  }
}
