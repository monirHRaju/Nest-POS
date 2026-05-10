import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["RECEIPT", "BARCODE", "KITCHEN", "REPORT"]).default("RECEIPT"),
  connectionType: z.enum(["USB", "NETWORK", "BLUETOOTH", "BROWSER"]).default("BROWSER"),
  ipAddress: z.string().optional().nullable(),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  characterWidth: z.number().int().min(20).max(80).default(48),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};

  const [data, total] = await Promise.all([
    user.db.printer.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
    user.db.printer.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    if (parsed.isDefault) {
      await user.db.printer.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const printer = await user.db.printer.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        connectionType: parsed.connectionType,
        ipAddress: parsed.ipAddress || null,
        port: parsed.port || null,
        characterWidth: parsed.characterWidth,
        isDefault: parsed.isDefault,
        isActive: parsed.isActive,
      } as any,
    });

    return ok(printer, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Printer create error:", e);
    return error("Internal server error", 500);
  }
}
