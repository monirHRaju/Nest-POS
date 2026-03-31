import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  discountPercent: z.number().min(0).max(100).default(0),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.customerGroup.findMany({
      where: { name: { contains: search, mode: "insensitive" } },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.customerGroup.count({
      where: { name: { contains: search, mode: "insensitive" } },
    }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, discountPercent } = createSchema.parse(body);

    const existing = await user.db.customerGroup.findFirst({ where: { name } });
    if (existing) return error("Customer group already exists", 400);

    const item = await user.db.customerGroup.create({
      data: { name, discountPercent },
    });

    return ok(item, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return error("Validation error", 400);
    console.error("Error:", error);
    return error("Internal server error", 500);
  }
}
