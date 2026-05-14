import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0).optional(),
  yearlyPrice: z.number().min(0).optional(),
  maxUsers: z.number().int().min(1).optional(),
  maxWarehouses: z.number().int().min(1).optional(),
  maxProducts: z.number().int().min(1).optional(),
  features: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);
    const updated = await prisma.plan.update({ where: { id }, data: parsed });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    console.error("Plan update error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tenantCount = await prisma.tenant.count({ where: { planId: id } });
  if (tenantCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${tenantCount} tenant(s) using this plan` },
      { status: 400 }
    );
  }

  try {
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error("Plan delete error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
