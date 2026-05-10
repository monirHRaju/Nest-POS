import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const adjustment = await user.db.adjustment.findUnique({
    where: { id: (await params).id },
    include: {
      warehouse: { select: { id: true, name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: { select: { shortName: true } },
            },
          },
        },
      },
    },
  });

  if (!adjustment) return error("Adjustment not found", 404);
  return ok(adjustment);
}
