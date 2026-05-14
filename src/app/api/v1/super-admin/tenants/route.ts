import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session.user;
}

export async function GET(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const status = url.searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.subscriptionStatus = status;

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      plan: { select: { id: true, name: true, slug: true } },
      _count: { select: { users: true, warehouses: true } },
    },
  });

  return NextResponse.json({
    data: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      phone: t.phone,
      currency: t.currency,
      subscriptionStatus: t.subscriptionStatus,
      trialEndsAt: t.trialEndsAt?.toISOString() ?? null,
      isActive: t.isActive,
      plan: t.plan,
      maxUsers: t.maxUsers,
      maxWarehouses: t.maxWarehouses,
      maxProducts: t.maxProducts,
      userCount: t._count.users,
      warehouseCount: t._count.warehouses,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
