import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "lowercase, numbers, hyphens only"),
  description: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  maxUsers: z.number().int().min(1),
  maxWarehouses: z.number().int().min(1),
  maxProducts: z.number().int().min(1),
  features: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session.user;
}

export async function GET() {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
    include: { _count: { select: { tenants: true } } },
  });

  return NextResponse.json({
    data: plans.map((p) => ({
      ...p,
      monthlyPrice: Number(p.monthlyPrice),
      yearlyPrice: Number(p.yearlyPrice),
      tenantCount: p._count.tenants,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireSuperAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const existing = await prisma.plan.findUnique({ where: { slug: parsed.slug } });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 400 });

    const plan = await prisma.plan.create({ data: parsed });
    return NextResponse.json(plan, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    console.error("Plan create error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
