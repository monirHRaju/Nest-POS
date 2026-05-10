import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100).optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "USER"]),
  groupId: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  isActive: z.boolean(),
});

const PUBLIC_FIELDS = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  avatar: true,
  role: true,
  groupId: true,
  warehouseId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  group: { select: { id: true, name: true } },
  warehouse: { select: { id: true, name: true } },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.user.findUnique({
    where: { id: (await params).id },
    select: PUBLIC_FIELDS,
  });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await user.db.user.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    if (parsed.email !== existing.email) {
      const conflict = await user.db.user.findFirst({ where: { email: parsed.email } });
      if (conflict) return error("Email already in use", 400);
    }

    // Prevent demoting last OWNER
    if (existing.role === "OWNER" && parsed.role !== "OWNER") {
      const ownerCount = await user.db.user.count({ where: { role: "OWNER" } });
      if (ownerCount <= 1) return error("Cannot remove last OWNER", 400);
    }

    const { password, ...rest } = parsed;
    const data: Record<string, unknown> = { ...rest };
    if (password && password.length > 0) {
      data.password = await bcrypt.hash(password, 12);
    }

    const updated = await user.db.user.update({
      where: { id: (await params).id },
      data,
      select: PUBLIC_FIELDS,
    });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("User update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    if ((await params).id === user.id) return error("Cannot delete yourself", 400);

    const existing = await user.db.user.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    if (existing.role === "OWNER") {
      const ownerCount = await user.db.user.count({ where: { role: "OWNER" } });
      if (ownerCount <= 1) return error("Cannot delete last OWNER", 400);
    }

    const salesCount = await user.db.sale.count({ where: { userId: (await params).id } });
    if (salesCount > 0) return error(`Cannot delete: ${salesCount} sale(s) linked`, 400);

    await user.db.user.delete({ where: { id: (await params).id } });
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    console.error("User delete error:", e);
    return error("Internal server error", 500);
  }
}
