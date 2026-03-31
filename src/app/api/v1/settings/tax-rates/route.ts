import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createTaxRateSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
  type: z.enum(["PERCENTAGE", "FIXED"]),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.taxRate.findMany({
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
    user.db.taxRate.count({
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
    const { name, rate, type } = createTaxRateSchema.parse(body);

    // Check if name already exists
    const existing = await user.db.taxRate.findFirst({
      where: { name },
    });

    if (existing) {
      return error("Tax rate with this name already exists", 400);
    }

    const taxRate = await user.db.taxRate.create({
      data: {
        name,
        rate,
        type,
      },
    });

    return ok(taxRate, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Tax rate creation error:", error);
    return error("Internal server error", 500);
  }
}
