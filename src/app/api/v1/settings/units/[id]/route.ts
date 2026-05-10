import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateUnitSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(20),
  baseUnit: z.string().max(100).optional().nullable(),
  operator: z.enum(["*", "/"]).optional().nullable(),
  operationValue: z.number().positive().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const unit = await user.db.unit.findUnique({
    where: { id: (await params).id },
  });

  if (!unit) {
    return error("Unit not found", 404);
  }

  return ok(unit);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, shortName, baseUnit, operator, operationValue } =
      updateUnitSchema.parse(body);

    // Check unit exists
    const existing = await user.db.unit.findUnique({
      where: { id: (await params).id },
    });

    if (!existing) {
      return error("Unit not found", 404);
    }

    // Check if name conflicts with other units
    if (name !== existing.name) {
      const conflict = await user.db.unit.findFirst({
        where: { name },
      });
      if (conflict) {
        return error("Unit with this name already exists", 400);
      }
    }

    const updated = await user.db.unit.update({
      where: { id: (await params).id },
      data: {
        name,
        shortName,
        baseUnit: baseUnit || null,
        operator: operator || null,
        operationValue: operationValue || null,
      },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Unit update error:", error);
    return error("Internal server error", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    // Check unit exists
    const existing = await user.db.unit.findUnique({
      where: { id: (await params).id },
    });

    if (!existing) {
      return error("Unit not found", 404);
    }

    // Check if unit is being used by products
    const productsCount = await user.db.product.count({
      where: { unitId: (await params).id },
    });

    if (productsCount > 0) {
      return error(
        `Cannot delete unit with ${productsCount} product(s) assigned`,
        400
      );
    }

    await user.db.unit.delete({
      where: { id: (await params).id },
    });

    return ok({ message: "Unit deleted successfully" });
  } catch (error) {
    console.error("Unit deletion error:", error);
    return error("Internal server error", 500);
  }
}
