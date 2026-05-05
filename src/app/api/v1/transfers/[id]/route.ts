import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { applyTransferStock } from "@/lib/services/stockService";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "SENT", "COMPLETED", "CANCELED"]),
  note: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.transfer.findUnique({
    where: { id: params.id },
    include: { items: true, fromWarehouse: true, toWarehouse: true },
  });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await user.db.transfer.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    if (existing.status !== parsed.status) {
      // PENDING/SENT → COMPLETED: apply stock movement
      if (existing.status !== "COMPLETED" && parsed.status === "COMPLETED") {
        await applyTransferStock(user.tenantId, params.id, existing.fromWarehouseId, existing.toWarehouseId, 1);
      }
      // COMPLETED → CANCELED: reverse stock movement
      if (existing.status === "COMPLETED" && parsed.status === "CANCELED") {
        await applyTransferStock(user.tenantId, params.id, existing.fromWarehouseId, existing.toWarehouseId, -1);
      }
    }

    const updated = await user.db.transfer.update({
      where: { id: params.id },
      data: { status: parsed.status, note: parsed.note },
    });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Transfer update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.transfer.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);
    if (existing.status === "COMPLETED") {
      return error("Cannot delete completed transfer. Cancel first to reverse stock.", 400);
    }
    await user.db.transfer.delete({ where: { id: params.id } });
    return ok({ message: "Deleted" });
  } catch (e) {
    console.error("Transfer delete error:", e);
    return error("Internal server error", 500);
  }
}
