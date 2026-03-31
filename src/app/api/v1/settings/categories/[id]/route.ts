import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  parentId: z.string().optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const category = await user.db.category.findUnique({
    where: { id: params.id },
    include: {
      parent: {
        select: { id: true, name: true },
      },
    },
  });

  if (!category) {
    return error("Category not found", 404);
  }

  return ok(category);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const body = await req.json();
    const { name, slug, parentId } = updateSchema.parse(body);

    // Check category exists
    const existing = await user.db.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Category not found", 404);
    }

    // Generate slug if not provided
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check if new slug conflicts with other categories
    if (finalSlug !== existing.slug) {
      const conflict = await user.db.category.findFirst({
        where: { slug: finalSlug },
      });
      if (conflict) {
        return error("Category with this name already exists", 400);
      }
    }

    // Prevent circular reference: category cannot be its own parent
    if (parentId === params.id) {
      return error("Category cannot be its own parent", 400);
    }

    // If parentId provided, verify it exists
    if (parentId && parentId !== existing.parentId) {
      const parent = await user.db.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return error("Parent category not found", 404);
      }

      // Prevent indirect circular reference: ensure parent is not a child of this category
      const parentIds = new Set<string>();
      let current = parentId;
      while (current) {
        if (current === params.id) {
          return error("This would create a circular reference", 400);
        }
        parentIds.add(current);
        const cat = await user.db.category.findUnique({ where: { id: current } });
        current = cat?.parentId || null;
      }
    }

    const updated = await user.db.category.update({
      where: { id: params.id },
      data: {
        name,
        slug: finalSlug,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Category update error:", error);
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
    // Check category exists
    const existing = await user.db.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return error("Category not found", 404);
    }

    // Check if category has child categories
    const childrenCount = await user.db.category.count({
      where: { parentId: params.id },
    });

    if (childrenCount > 0) {
      return error(`Cannot delete category with ${childrenCount} subcategory(ies)`, 400);
    }

    // Check if category is being used by products
    const productsCount = await user.db.product.count({
      where: { categoryId: params.id },
    });

    if (productsCount > 0) {
      return error(
        `Cannot delete category with ${productsCount} product(s) assigned`,
        400
      );
    }

    await user.db.category.delete({
      where: { id: params.id },
    });

    return ok({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Category deletion error:", error);
    return error("Internal server error", 500);
  }
}
