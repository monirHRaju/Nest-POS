import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { getTenantLimits, getResourceCount, checkSubscriptionAccess } from "@/lib/saas/limits";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limits = await getTenantLimits(user.tenantId);
  if (!limits) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const [users, warehouses, products] = await Promise.all([
    getResourceCount(user.tenantId, "users"),
    getResourceCount(user.tenantId, "warehouses"),
    getResourceCount(user.tenantId, "products"),
  ]);

  const access = checkSubscriptionAccess(limits);

  return NextResponse.json({
    planName: limits.planName,
    subscriptionStatus: limits.subscriptionStatus,
    trialEndsAt: limits.trialEndsAt?.toISOString() ?? null,
    daysLeft: access.daysLeft,
    expired: access.expired,
    allowed: access.allowed,
    reason: access.reason,
    usage: {
      users: { current: users, max: limits.maxUsers },
      warehouses: { current: warehouses, max: limits.maxWarehouses },
      products: { current: products, max: limits.maxProducts },
    },
  });
}
