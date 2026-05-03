import { UserRole } from "@/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string | null;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole | null;
      warehouseId: string | null;
      permissions: Record<string, boolean>;
      isSuperAdmin: boolean;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    tenantId: string | null;
    firstName: string;
    lastName: string;
    role: UserRole | null;
    warehouseId: string | null;
    groupPermissions: Record<string, boolean>;
    isSuperAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string | null;
    firstName: string;
    lastName: string;
    role: UserRole | null;
    warehouseId: string | null;
    permissions: Record<string, boolean>;
    isSuperAdmin: boolean;
  }
}
