import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/prisma-tenant";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getTenantPrisma(session.user.tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todaySalesAgg,
      todayPurchasesAgg,
      todayReturnsAgg,
      todayExpensesAgg,
      totalProducts,
      totalCustomers,
      recentSales,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { grandTotal: true },
        where: { date: { gte: today, lt: tomorrow }, status: "COMPLETED" },
      }),
      db.purchase.aggregate({
        _sum: { grandTotal: true },
        where: { date: { gte: today, lt: tomorrow }, status: "RECEIVED" },
      }),
      db.return.aggregate({
        _sum: { grandTotal: true },
        where: { date: { gte: today, lt: tomorrow }, status: "COMPLETED" },
      }),
      db.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: today, lt: tomorrow } },
      }),
      db.product.count({ where: { isActive: true } }),
      db.customer.count({ where: { isActive: true } }),
      db.sale.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      }),
    ]);

    // Count products below alert quantity
    const { prisma } = await import("@/lib/prisma");
    const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT p.id)::bigint as count
      FROM products p
      JOIN product_warehouse_stocks pws ON p.id = pws."productId"
      WHERE p."tenantId" = ${session.user.tenantId}
        AND p."isActive" = true
        AND p."alertQuantity" > 0
        AND pws.quantity <= p."alertQuantity"
    `;

    return NextResponse.json({
      todaySales: Number(todaySalesAgg._sum.grandTotal ?? 0),
      todayPurchases: Number(todayPurchasesAgg._sum.grandTotal ?? 0),
      todayReturns: Number(todayReturnsAgg._sum.grandTotal ?? 0),
      todayExpenses: Number(todayExpensesAgg._sum.amount ?? 0),
      totalProducts,
      totalCustomers,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        referenceNo: s.referenceNo,
        grandTotal: s.grandTotal.toString(),
        createdAt: s.createdAt.toISOString(),
        customerName: s.customer?.name ?? "Walk-in Customer",
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
