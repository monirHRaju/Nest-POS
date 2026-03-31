import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const brand = await user.db.brand.findUnique({
    where: { id: params.id },
  });

  if (!brand) {
    return error("Brand not found", 404);
  }

  return ok(brand);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, slug } = updateBrandSchema.parse(body);

    // Check brand exists
    const existing = await user.db.brand.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Brand not found", 404);
    }

    // Generate slug if not provided
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check if new slug conflicts with other brands
    if (finalSlug !== existing.slug) {
      const conflict = await user.db.brand.findFirst({
        where: { slug: finalSlug },
      });
      if (conflict) {
        return error("Brand with this name already exists", 400);
      }
    }

    const updated = await user.db.brand.update({
      where: { id: params.id },
      data: { name, slug: finalSlug },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Brand update error:", error);
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
    // Check brand exists
    const existing = await user.db.brand.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Brand not found", 404);
    }

    // Check if brand is being used by products
    const productsCount = await user.db.product.count({
      where: { brandId: params.id },
    });

    if (productsCount > 0) {
      return error(
        `Cannot delete brand with ${productsCount} product(s) assigned`,
        400
      );
    }

    await user.db.brand.delete({
      where: { id: params.id },
    });

    return ok({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Brand deletion error:", error);
    return error("Internal server error", 500);
  }
}
