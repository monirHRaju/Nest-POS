import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.supplier.findUnique({ where: { id: (await params).id } });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);
    const data = { ...parsed, email: parsed.email || null };

    const existing = await user.db.supplier.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    const updated = await user.db.supplier.update({ where: { id: (await params).id }, data: data as any });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Supplier update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.supplier.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    const purchasesCount = await user.db.purchase.count({ where: { supplierId: (await params).id } });
    if (purchasesCount > 0) return error(`Cannot delete: ${purchasesCount} purchase(s) linked`, 400);

    await user.db.supplier.delete({ where: { id: (await params).id } });
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    console.error("Supplier delete error:", e);
    return error("Internal server error", 500);
  }
}
