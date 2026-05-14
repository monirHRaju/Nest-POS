import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      monthlyPrice: true,
      yearlyPrice: true,
      maxUsers: true,
      maxWarehouses: true,
      maxProducts: true,
      features: true,
    },
  });

  return NextResponse.json({
    data: plans.map((p) => ({
      ...p,
      monthlyPrice: Number(p.monthlyPrice),
      yearlyPrice: Number(p.yearlyPrice),
    })),
  });
}
