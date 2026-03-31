import { auth } from "./auth";
import { getTenantPrisma, TenantPrismaClient } from "./prisma-tenant";
import { Session } from "next-auth";

/**
 * Get authenticated user with tenant-scoped database
 * Returns null if not authenticated
 * Returns { user: session.user, db: tenant-scoped prisma }
 */
export async function getAuthenticatedUser(): Promise<{
  id: string;
  email: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  role: string;
  warehouseId: string | null;
  permissions: Record<string, boolean>;
  db: TenantPrismaClient;
} | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;
  const tenantId = user.tenantId;

  if (!tenantId) {
    return null;
  }

  const db = getTenantPrisma(tenantId);

  return {
    id: user.id,
    email: user.email,
    tenantId,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    warehouseId: user.warehouseId,
    permissions: user.permissions || {},
    db,
  };
}

/**
 * Check if user has permission for an action
 * Usage: if (!hasPermission(user.permissions, "products.view")) return error(...)
 */
export function hasPermission(
  permissions: Record<string, boolean>,
  key: string
): boolean {
  return permissions?.[key] === true;
}

/**
 * Require permission and return error if not authorized
 * Usage: if (!requirePermission(user.permissions, "products.view")) return error("Unauthorized", 403)
 */
export function requirePermission(
  permissions: Record<string, boolean>,
  key: string
): boolean {
  return hasPermission(permissions, key);
}
