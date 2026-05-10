import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["RECEIPT", "BARCODE", "KITCHEN", "REPORT"]).optional(),
  connectionType: z.enum(["USB", "NETWORK", "BLUETOOTH", "BROWSER"]).optional(),
  ipAddress: z.string().optional().nullable(),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  characterWidth: z.number().int().min(20).max(80).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await params;
  const printer = await user.db.printer.findUnique({ where: { id } });
  if (!printer) return error("Not found", 404);
  return ok(printer);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    if (parsed.isDefault === true) {
      await user.db.printer.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await user.db.printer.update({ where: { id }, data: parsed });
    return ok(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Printer update error:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);
  const { id } = await params;

  try {
    await user.db.printer.delete({ where: { id } });
    return ok({ message: "Deleted" });
  } catch (e) {
    console.error("Printer delete error:", e);
    return error("Internal server error", 500);
  }
}
