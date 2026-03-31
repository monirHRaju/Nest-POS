import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  discountPercent: z.number().min(0).max(100),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.customerGroup.findUnique({ where: { id: params.id } });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, discountPercent } = updateSchema.parse(body);

    const existing = await user.db.customerGroup.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    if (name !== existing.name) {
      const conflict = await user.db.customerGroup.findFirst({ where: { name } });
      if (conflict) return error("Name already exists", 400);
    }

    const updated = await user.db.customerGroup.update({
      where: { id: params.id },
      data: { name, discountPercent },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return error("Validation error", 400);
    console.error("Error:", error);
    return error("Internal server error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.customerGroup.findUnique({ where: { id: params.id } });
    if (!existing) return error("Not found", 404);

    const customersCount = await user.db.customer.count({ where: { customerGroupId: params.id } });
    if (customersCount > 0) {
      return error(`Cannot delete group with ${customersCount} customer(s)`, 400);
    }

    await user.db.customerGroup.delete({ where: { id: params.id } });
    return ok({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return error("Internal server error", 500);
  }
}
