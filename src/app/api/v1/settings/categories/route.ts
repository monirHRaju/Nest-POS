import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error, parseSearchParams } from "@/lib/api-response";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  parentId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const { page, pageSize, search } = parseSearchParams(req);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    user.db.category.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    }),
    user.db.category.count({
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
    const { name, slug, parentId } = createSchema.parse(body);

    // Generate slug if not provided
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existing = await user.db.category.findFirst({
      where: { slug: finalSlug },
    });

    if (existing) {
      return error("Category with this name already exists", 400);
    }

    // If parentId provided, verify it exists and belongs to tenant
    if (parentId) {
      const parent = await user.db.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return error("Parent category not found", 404);
      }
    }

    const category = await user.db.category.create({
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

    return ok(category, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error("Validation error", 400);
    }
    console.error("Category creation error:", error);
    return error("Internal server error", 500);
  }
}
