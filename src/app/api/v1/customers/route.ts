import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
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
  rewardPoints: z.number().int().min(0).default(0),
  deposit: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    user.db.customer.findMany({
      where,
      include: { customerGroup: true },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.customer.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const data = { ...parsed, email: parsed.email || null };

    const item = await user.db.customer.create({ data: data as any });
    return ok(item, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("Customer create error:", e);
    return error("Internal server error", 500);
  }
}
