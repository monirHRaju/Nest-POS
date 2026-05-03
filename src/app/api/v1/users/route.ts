import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().optional().nullable(),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "USER"]).default("USER"),
  groupId: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
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

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    user.db.user.findMany({
      where,
      select: PUBLIC_FIELDS,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.user.count({ where }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    // Email unique within tenant
    const existing = await user.db.user.findFirst({ where: { email: parsed.email } });
    if (existing) return error("Email already in use", 400);

    // Plan limit check
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    if (tenant) {
      const userCount = await user.db.user.count();
      if (userCount >= tenant.maxUsers) {
        return error(`User limit reached (${tenant.maxUsers}). Upgrade plan to add more.`, 400);
      }
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 12);
    const { password, ...rest } = parsed;
    const created = await user.db.user.create({
      data: { ...rest, password: hashedPassword } as any,
      select: PUBLIC_FIELDS,
    });

    return ok(created, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return error("Validation error", 400);
    console.error("User create error:", e);
    return error("Internal server error", 500);
  }
}
