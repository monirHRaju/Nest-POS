import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
  type: z.enum(["PERCENTAGE", "FIXED"]),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const taxRate = await user.db.taxRate.findUnique({
    where: { id: params.id },
  });

  if (!taxRate) {
    return error("Tax rate not found", 404);
  }

  return ok(taxRate);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, rate, type } = updateTaxRateSchema.parse(body);

    // Check tax rate exists
    const existing = await user.db.taxRate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Tax rate not found", 404);
    }

    // Check if name conflicts with other tax rates
    if (name !== existing.name) {
      const conflict = await user.db.taxRate.findFirst({
        where: { name },
      });
      if (conflict) {
        return error("Tax rate with this name already exists", 400);
      }
    }

    const updated = await user.db.taxRate.update({
      where: { id: params.id },
      data: { name, rate, type },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Tax rate update error:", error);
    return error("Internal server error", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    // Check tax rate exists
    const existing = await user.db.taxRate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Tax rate not found", 404);
    }

    // Check if tax rate is being used by products or sales
    const productsCount = await user.db.product.count({
      where: { taxId: params.id },
    });

    const saleItemsCount = await user.db.saleItem.count({
      where: { taxId: params.id },
    });

    if (productsCount > 0 || saleItemsCount > 0) {
      return error(
        `Cannot delete tax rate that is in use (${productsCount} products, ${saleItemsCount} sale items)`,
        400
      );
    }

    await user.db.taxRate.delete({
      where: { id: params.id },
    });

    return ok({ message: "Tax rate deleted successfully" });
  } catch (error) {
    console.error("Tax rate deletion error:", error);
    return error("Internal server error", 500);
  }
}
