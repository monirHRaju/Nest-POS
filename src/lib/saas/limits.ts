import { prisma } from "@/lib/prisma";

export type Resource = "users" | "warehouses" | "products";

export interface TenantLimits {
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
  isActive: boolean;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  planName: string | null;
}

export async function getTenantLimits(tenantId: string): Promise<TenantLimits | null> {
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: { select: { name: true } } },
  });
  if (!t) return null;
  return {
    maxUsers: t.maxUsers,
    maxWarehouses: t.maxWarehouses,
    maxProducts: t.maxProducts,
    isActive: t.isActive,
    subscriptionStatus: t.subscriptionStatus,
    trialEndsAt: t.trialEndsAt,
    planName: t.plan?.name ?? null,
  };
}

export async function getResourceCount(tenantId: string, resource: Resource): Promise<number> {
  switch (resource) {
    case "users":
      return prisma.user.count({ where: { tenantId, isActive: true } });
    case "warehouses":
      return prisma.warehouse.count({ where: { tenantId, isActive: true } });
    case "products":
      return prisma.product.count({ where: { tenantId, isActive: true } });
  }
}

/**
 * Returns null if within limit, error message string if at/over limit.
 */
export async function checkPlanLimit(tenantId: string, resource: Resource): Promise<string | null> {
  const limits = await getTenantLimits(tenantId);
  if (!limits) return "Tenant not found";

  const max =
    resource === "users" ? limits.maxUsers
    : resource === "warehouses" ? limits.maxWarehouses
    : limits.maxProducts;

  const current = await getResourceCount(tenantId, resource);
  if (current >= max) {
    return `Plan limit reached. Maximum ${max} ${resource}${limits.planName ? ` on ${limits.planName} plan` : ""}.`;
  }
  return null;
}

/**
 * Trial/subscription gate. Returns null if access allowed, error string otherwise.
 * Soft-block: reads always allowed; mutations blocked when trial expired or subscription canceled.
 */
export interface AccessCheck {
  allowed: boolean;
  reason: string | null;
  daysLeft: number | null;
  expired: boolean;
}

export function checkSubscriptionAccess(limits: TenantLimits): AccessCheck {
  if (!limits.isActive) {
    return { allowed: false, reason: "Account suspended. Contact support.", daysLeft: null, expired: true };
  }

  const status = limits.subscriptionStatus;
  if (status === "ACTIVE") {
    return { allowed: true, reason: null, daysLeft: null, expired: false };
  }

  if (status === "TRIAL") {
    if (!limits.trialEndsAt) {
      return { allowed: true, reason: null, daysLeft: null, expired: false };
    }
    const msLeft = limits.trialEndsAt.getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (msLeft <= 0) {
      return { allowed: false, reason: "Trial expired. Upgrade to a paid plan to continue.", daysLeft: 0, expired: true };
    }
    return { allowed: true, reason: null, daysLeft, expired: false };
  }

  if (status === "PAST_DUE") {
    return { allowed: false, reason: "Payment past due. Update billing to continue.", daysLeft: null, expired: true };
  }

  // CANCELED, EXPIRED
  return { allowed: false, reason: "Subscription inactive. Resubscribe to continue.", daysLeft: null, expired: true };
}

export async function requireMutationAccess(tenantId: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  const limits = await getTenantLimits(tenantId);
  if (!limits) return { ok: false, error: "Tenant not found", status: 404 };
  const check = checkSubscriptionAccess(limits);
  if (!check.allowed) return { ok: false, error: check.reason || "Access denied", status: 403 };
  return { ok: true };
}
