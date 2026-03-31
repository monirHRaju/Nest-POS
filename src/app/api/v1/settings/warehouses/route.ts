import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  isDefault: z.boolean().default(false),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.warehouse.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    user.db.warehouse.count({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    }),
  ]);

  return ok({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, code, phone, email, address, city, state, country, isDefault } =
      createSchema.parse(body);

    // Check plan limits
    const tenant = await user.db.tenant.findUnique({
      where: { id: user.tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      return error("Tenant not found", 404);
    }

    if (tenant.plan) {
      const warehouseCount = await user.db.warehouse.count({});
      const maxWarehouses = tenant.plan.maxWarehouses || 1;

      if (warehouseCount >= maxWarehouses) {
        return error(
          `Plan limit reached. Maximum ${maxWarehouses} warehouse(s) allowed.`,
          400
        );
      }
    }

    // Check if code already exists
    const existing = await user.db.warehouse.findFirst({
      where: { code },
    });

    if (existing) {
      return error("Warehouse with this code already exists", 400);
    }

    const warehouse = await user.db.warehouse.create({
      data: {
        name,
        code,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        isDefault,
      },
    });

    return ok(warehouse, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Warehouse creation error:", error);
    return error("Internal server error", 500);
  }
}
