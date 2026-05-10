import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { applySaleStock } from "@/lib/services/saleService";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELED"]).optional(),
  note: z.string().optional().nullable(),
  staffNote: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { id } = await params;

  const item = await user.db.sale.findUnique({
    where: { id },
    include: {
      items: true,
      customer: true,
      biller: true,
      warehouse: true,
      user: { select: { id: true, firstName: true, lastName: true } },
      orderTax: true,
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await user.db.sale.findUnique({ where: { id } });
    if (!existing) return error("Not found", 404);

    const data: Record<string, unknown> = {};
    if (parsed.note !== undefined) data.note = parsed.note;
    if (parsed.staffNote !== undefined) data.staffNote = parsed.staffNote;

    if (parsed.status && parsed.status !== existing.status) {
      // Status transitions: COMPLETED → CANCELED reverses stock
      if (existing.status === "COMPLETED" && parsed.status === "CANCELED") {
        await applySaleStock(user.tenantId, id, existing.warehouseId, 1);
      }
      // PENDING → COMPLETED decrements stock
      if (existing.status === "PENDING" && parsed.status === "COMPLETED") {
        await applySaleStock(user.tenantId, id, existing.warehouseId, -1);
      }
      data.status = parsed.status;
    }

    const updated = await user.db.sale.update({
      where: { id },
      data,
      include: { items: true, payments: true },
    });

    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Sale update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { id } = await params;

  try {
    const existing = await user.db.sale.findUnique({ where: { id } });
    if (!existing) return error("Not found", 404);

    if (existing.status === "COMPLETED") {
      return error("Cannot delete completed sale. Cancel first to reverse stock.", 400);
    }

    const returnsCount = await user.db.return.count({ where: { saleId: id } });
    if (returnsCount > 0) return error(`Cannot delete: ${returnsCount} return(s) linked`, 400);

    await user.db.sale.delete({ where: { id } });
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    console.error("Sale delete error:", e);
    return error("Internal server error", 500);
  }
}
