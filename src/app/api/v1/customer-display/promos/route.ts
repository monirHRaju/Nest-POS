import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  const now = new Date();
  const promos = await user.db.promo.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });

  return ok({
    data: promos.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      type: p.type,
      value: Number(p.value),
      minimumAmount: Number(p.minimumAmount),
      endDate: p.endDate.toISOString(),
    })),
  });
}
