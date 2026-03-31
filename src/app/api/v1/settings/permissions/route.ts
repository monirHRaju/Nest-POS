import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.record(z.boolean()).default({}),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.permissionGroup.findMany({
      where: { name: { contains: search, mode: "insensitive" } },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    }),
    user.db.permissionGroup.count({
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
    const { name, description, permissions } = createSchema.parse(body);

    const existing = await user.db.permissionGroup.findFirst({ where: { name } });
    if (existing) return error("Permission group with this name already exists", 400);

    const group = await user.db.permissionGroup.create({
      data: {
        name,
        description: description || null,
        permissions,
      },
    });

    return ok(group, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return error("Validation error", 400);
    console.error("Permission group creation error:", err);
    return error("Internal server error", 500);
  }
}
