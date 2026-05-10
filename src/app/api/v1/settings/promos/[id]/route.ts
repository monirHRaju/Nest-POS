import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  value: z.number().min(0).optional(),
  minimumAmount: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await params;
  const promo = await user.db.promo.findUnique({ where: { id } });
  if (!promo) return error("Not found", 404);
  return ok(promo);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const data: Record<string, unknown> = { ...parsed };
    if (parsed.startDate) data.startDate = new Date(parsed.startDate);
    if (parsed.endDate) data.endDate = new Date(parsed.endDate);

    const updated = await user.db.promo.update({ where: { id }, data });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Promo update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await params;

  try {
    await user.db.promo.delete({ where: { id } });
    return ok({ message: "Deleted" });
  } catch (e) {
    console.error("Promo delete error:", e);
    return error("Internal server error", 500);
  }
}
