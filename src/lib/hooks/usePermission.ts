"use client";

import { hasPermission, type Permission } from "@/lib/permissions";
import { useCurrentSession } from "./useSession";

export function usePermission(permission: Permission): boolean {
  const { user } = useCurrentSession();
  if (!user) return false;
  return hasPermission(user.role, permission, user.permissions);
}
