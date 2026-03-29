import { UserRole } from "@/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      warehouseId: string | null;
      permissions: Record<string, boolean>;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    warehouseId: string | null;
    groupPermissions: Record<string, boolean>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    warehouseId: string | null;
    permissions: Record<string, boolean>;
  }
}
