import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createUnitSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(20),
  baseUnit: z.string().max(100).optional(),
  operator: z.enum(["*", "/"]).optional(),
  operationValue: z.number().positive().optional(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.unit.findMany({
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
    user.db.unit.count({
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
    const { name, shortName, baseUnit, operator, operationValue } =
      createUnitSchema.parse(body);

    // Check if name already exists
    const existing = await user.db.unit.findFirst({
      where: { name },
    });

    if (existing) {
      return error("Unit with this name already exists", 400);
    }

    const unit = await user.db.unit.create({
      data: {
        name,
        shortName,
        baseUnit: baseUnit || null,
        operator: operator || null,
        operationValue: operationValue || null,
      },
    });

    return ok(unit, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Unit creation error:", error);
    return error("Internal server error", 500);
  }
}
