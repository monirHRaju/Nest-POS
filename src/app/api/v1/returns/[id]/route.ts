import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { applyReturnStock } from "@/lib/services/stockService";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.return.findUnique({
    where: { id: (await params).id },
    include: {
      items: true,
      sale: { include: { items: true } },
      customer: true,
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.return.findUnique({
      where: { id: (await params).id },
      include: { sale: true },
    });
    if (!existing) return error("Not found", 404);

    // Reverse stock if completed
    if (existing.status === "COMPLETED" && existing.sale) {
      await applyReturnStock(user.tenantId, (await params).id, existing.sale.warehouseId, -1);
    }

    await user.db.payment.deleteMany({ where: { returnId: (await params).id } });
    await user.db.return.delete({ where: { id: (await params).id } });
    return ok({ message: "Deleted" });
  } catch (e) {
    console.error("Return delete error:", e);
    return error("Internal server error", 500);
  }
}
