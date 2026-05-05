import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  date: z.string().optional(),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  warehouseId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  attachment: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.expense.findUnique({
    where: { id: params.id },
    include: { category: true, warehouse: true },
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

    const existing = await user.db.expense.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    const updated = await user.db.expense.update({
      where: { id: params.id },
      data: {
        date: parsed.date ? new Date(parsed.date) : existing.date,
        categoryId: parsed.categoryId,
        amount: parsed.amount,
        warehouseId: parsed.warehouseId || null,
        note: parsed.note,
        attachment: parsed.attachment,
      } as any,
      include: { category: true, warehouse: true },
    });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Expense update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.expense.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);
    await user.db.expense.delete({ where: { id: params.id } });
    return ok({ message: "Deleted" });
  } catch (e) {
    console.error("Expense delete error:", e);
    return error("Internal server error", 500);
  }
}
