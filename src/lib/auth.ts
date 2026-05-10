import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email);
        const password = String(credentials.password);
        const tenantSlug = credentials.tenantSlug ? String(credentials.tenantSlug) : undefined;

        // Try regular tenant user first
        const user = await prisma.user.findFirst({
          where: {
            email,
            isActive: true,
            tenant: {
              isActive: true,
              ...(tenantSlug ? { slug: tenantSlug } : {}),
            },
          },
          include: { tenant: true, group: true },
        });

        if (user) {
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            warehouseId: user.warehouseId,
            groupPermissions: (user.group?.permissions as Record<string, boolean>) || {},
            isSuperAdmin: false,
            image: user.avatar,
          };
        }

        // Fall back to super admin (no tenant scope)
        const superAdmin = await prisma.superAdmin.findFirst({
          where: { email, isActive: true },
        });

        if (!superAdmin) return null;

        const isValid = await bcrypt.compare(password, superAdmin.password);
        if (!isValid) return null;

        return {
          id: superAdmin.id,
          email: superAdmin.email,
          tenantId: null,
          firstName: superAdmin.name,
          lastName: "",
          role: null,
          warehouseId: null,
          groupPermissions: {},
          isSuperAdmin: true,
          image: null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.warehouseId = user.warehouseId;
        token.permissions = user.groupPermissions;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string | null;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      session.user.role = token.role as import("@/generated/prisma/client").UserRole | null;
      session.user.warehouseId = (token.warehouseId as string) || null;
      session.user.permissions = (token.permissions as Record<string, boolean>) || {};
      session.user.isSuperAdmin = (token.isSuperAdmin as boolean) || false;
      return session;
    },
  },
});
