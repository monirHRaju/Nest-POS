import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  values: z.array(z.string().min(1)).min(1),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const variant = await user.db.variant.findUnique({
    where: { id: params.id },
  });

  if (!variant) {
    return error("Variant not found", 404);
  }

  return ok(variant);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, values } = updateSchema.parse(body);

    // Check variant exists
    const existing = await user.db.variant.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Variant not found", 404);
    }

    // Check if name conflicts with other variants
    if (name !== existing.name) {
      const conflict = await user.db.variant.findFirst({
        where: { name },
      });
      if (conflict) {
        return error("Variant with this name already exists", 400);
      }
    }

    const updated = await user.db.variant.update({
      where: { id: params.id },
      data: {
        name,
        values,
      },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Variant update error:", error);
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
    // Check variant exists
    const existing = await user.db.variant.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Variant not found", 404);
    }

    // Check if variant is being used by products
    const productsCount = await user.db.productVariant.count({
      where: { variantId: params.id },
    });

    if (productsCount > 0) {
      return error(
        `Cannot delete variant with ${productsCount} product variant(s) assigned`,
        400
      );
    }

    await user.db.variant.delete({
      where: { id: params.id },
    });

    return ok({ message: "Variant deleted successfully" });
  } catch (error) {
    console.error("Variant deletion error:", error);
    return error("Internal server error", 500);
  }
}
