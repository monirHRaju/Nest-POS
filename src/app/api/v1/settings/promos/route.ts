import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  type: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  value: z.number().min(0),
  minimumAmount: z.number().min(0).default(0),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const url = new URL(req.url);
  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;
  const activeOnly = url.searchParams.get("activeOnly") === "1";

  const where: Record<string, unknown> = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }
    : {};

  if (activeOnly) {
    const now = new Date();
    where.isActive = true;
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  }

  const [data, total] = await Promise.all([
    user.db.promo.findMany({ where, skip, take: pageSize, orderBy: { startDate: "desc" } }),
    user.db.promo.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const existing = await user.db.promo.findFirst({ where: { code: parsed.code } });
    if (existing) return error("Promo with this code already exists", 400);

    const promo = await user.db.promo.create({
      data: {
        name: parsed.name,
        code: parsed.code,
        type: parsed.type,
        value: parsed.value,
        minimumAmount: parsed.minimumAmount,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        isActive: parsed.isActive,
      } as any,
    });

    return ok(promo, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Promo create error:", e);
    return error("Internal server error", 500);
  }
}
