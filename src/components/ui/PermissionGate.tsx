"use client";

import { usePermission } from "@/lib/hooks/usePermission";
import type { Permission } from "@/lib/permissions";

export default function PermissionGate({
  permission,
  children,
  fallback,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = usePermission(permission);
  if (!allowed) return fallback ?? null;
  return <>{children}</>;
}
