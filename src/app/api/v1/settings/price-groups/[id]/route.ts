import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.priceGroup.findUnique({ where: { id: (await params).id } });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, description } = updateSchema.parse(body);

    const existing = await user.db.priceGroup.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    if (name !== existing.name) {
      const conflict = await user.db.priceGroup.findFirst({ where: { name } });
      if (conflict) return error("Name already exists", 400);
    }

    const updated = await user.db.priceGroup.update({
      where: { id: (await params).id },
      data: { name, description: description || null },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return error("Validation error", 400);
    console.error("Error:", error);
    return error("Internal server error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.priceGroup.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    await user.db.priceGroup.delete({ where: { id: (await params).id } });
    return ok({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return error("Internal server error", 500);
  }
}
