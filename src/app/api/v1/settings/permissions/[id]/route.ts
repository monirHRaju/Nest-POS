import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  permissions: z.record(z.boolean()),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const group = await user.db.permissionGroup.findUnique({
    where: { id: (await params).id },
    include: { _count: { select: { users: true } } },
  });

  if (!group) return error("Permission group not found", 404);
  return ok(group);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, description, permissions } = updateSchema.parse(body);

    const existing = await user.db.permissionGroup.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Permission group not found", 404);

    if (name !== existing.name) {
      const conflict = await user.db.permissionGroup.findFirst({ where: { name } });
      if (conflict) return error("Name already exists", 400);
    }

    const updated = await user.db.permissionGroup.update({
      where: { id: (await params).id },
      data: { name, description: description || null, permissions },
    });

    return ok(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return error("Validation error", 400);
    console.error("Permission group update error:", err);
    return error("Internal server error", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const existing = await user.db.permissionGroup.findUnique({
      where: { id: (await params).id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) return error("Permission group not found", 404);

    if (existing._count.users > 0) {
      return error(
        `Cannot delete group assigned to ${existing._count.users} user(s). Reassign users first.`,
        400
      );
    }

    await user.db.permissionGroup.delete({ where: { id: (await params).id } });
    return ok({ message: "Permission group deleted successfully" });
  } catch (err) {
    console.error("Permission group deletion error:", err);
    return error("Internal server error", 500);
  }
}
