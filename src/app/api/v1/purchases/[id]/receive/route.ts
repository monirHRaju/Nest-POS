import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { applyPurchaseStock } from "@/lib/services/purchaseService";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { id } = await params;

  try {
    const purchase = await user.db.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!purchase) return error("Not found", 404);
    if (purchase.status === "RECEIVED") return error("Already received", 400);
    if (purchase.status === "CANCELED") return error("Cannot receive canceled purchase", 400);

    // Set receivedQty = quantity for items where receivedQty is 0
    await Promise.all(
      purchase.items.map((item) =>
        user.db.purchaseItem.update({
          where: { id: item.id },
          data: {
            receivedQty: Number(item.receivedQty) > 0 ? item.receivedQty : item.quantity,
          },
        })
      )
    );

    await user.db.purchase.update({
      where: { id },
      data: { status: "RECEIVED" },
    });

    await applyPurchaseStock(user.tenantId, id, purchase.warehouseId, 1);

    return ok({ message: "Purchase received and stock updated" });
  } catch (e) {
    console.error("Purchase receive error:", e);
    return error("Internal server error", 500);
  }
}
