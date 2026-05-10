import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().length(3).toUpperCase(),
  symbol: z.string().min(1).max(10),
  exchangeRate: z.number().positive(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const item = await user.db.currency.findUnique({ where: { id: (await params).id } });
  if (!item) return error("Not found", 404);
  return ok(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, code, symbol, exchangeRate } = updateSchema.parse(body);

    const existing = await user.db.currency.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    if (code !== existing.code) {
      const conflict = await user.db.currency.findFirst({ where: { code } });
      if (conflict) return error("Currency code already exists", 400);
    }

    const updated = await user.db.currency.update({
      where: { id: (await params).id },
      data: { name, code, symbol, exchangeRate },
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
    const existing = await user.db.currency.findUnique({ where: { id: (await params).id } });
    if (!existing) return error("Not found", 404);

    // Can't delete if it's the default currency for the tenant
    const tenantSettings = await user.db.systemSettings.findFirst({
      where: { tenantId: user.tenantId },
    });

    if (tenantSettings && tenantSettings.defaultCurrencyId === (await params).id) {
      return error("Cannot delete the default currency", 400);
    }

    await user.db.currency.delete({ where: { id: (await params).id } });
    return ok({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    return error("Internal server error", 500);
  }
}
