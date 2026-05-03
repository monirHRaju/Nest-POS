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
  postalCode: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  customerGroupId: z.string().optional().nullable(),
  rewardPoints: z.number().int().min(0),
  deposit: z.number().min(0),
  isActive: z.boolean(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.customer.findUnique({
    where: { id: params.id },
    include: { customerGroup: true },
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
    const data = { ...parsed, email: parsed.email || null };

    const existing = await user.db.customer.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);
    if (existing.isWalkIn) return error("Cannot edit walk-in customer", 400);

    const updated = await user.db.customer.update({ where: { id: params.id }, data: data as any });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Customer update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.customer.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);
    if (existing.isWalkIn) return error("Cannot delete walk-in customer", 400);

    const salesCount = await user.db.sale.count({ where: { customerId: params.id } });
    if (salesCount > 0) return error(`Cannot delete: ${salesCount} sale(s) linked`, 400);

    await user.db.customer.delete({ where: { id: params.id } });
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    console.error("Customer delete error:", e);
    return error("Internal server error", 500);
  }
}
