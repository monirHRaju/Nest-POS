import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  planId: z.string().nullable().optional(),
  subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"]).optional(),
  trialEndsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  maxUsers: z.number().int().min(1).optional(),
  maxWarehouses: z.number().int().min(1).optional(),
  maxProducts: z.number().int().min(1).optional(),
});

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session.user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      plan: true,
      _count: { select: { users: true, warehouses: true, products: true, sales: true } },
    },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tenant);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const data: Record<string, unknown> = {};
    if (parsed.planId !== undefined) {
      data.planId = parsed.planId;
      // Auto-sync limits from plan if assigned
      if (parsed.planId) {
        const plan = await prisma.plan.findUnique({ where: { id: parsed.planId } });
        if (plan) {
          data.maxUsers = plan.maxUsers;
          data.maxWarehouses = plan.maxWarehouses;
          data.maxProducts = plan.maxProducts;
        }
      }
    }
    if (parsed.subscriptionStatus !== undefined) data.subscriptionStatus = parsed.subscriptionStatus;
    if (parsed.trialEndsAt !== undefined) data.trialEndsAt = parsed.trialEndsAt ? new Date(parsed.trialEndsAt) : null;
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
    if (parsed.maxUsers !== undefined) data.maxUsers = parsed.maxUsers;
    if (parsed.maxWarehouses !== undefined) data.maxWarehouses = parsed.maxWarehouses;
    if (parsed.maxProducts !== undefined) data.maxProducts = parsed.maxProducts;

    const updated = await prisma.tenant.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    console.error("Tenant update error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ message: "Tenant deleted" });
  } catch (e) {
    console.error("Tenant delete error:", e);
    return NextResponse.json({ error: "Cannot delete tenant. Check related data." }, { status: 500 });
  }
}
