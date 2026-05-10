import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const db = getTenantPrisma(tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const trendStart = new Date(today);
    trendStart.setDate(trendStart.getDate() - 29);

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

    // Low stock: count products at/below alertQuantity
    const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT p.id)::bigint as count
      FROM products p
      JOIN product_warehouse_stocks pws ON p.id = pws."productId"
      WHERE p."tenantId" = ${tenantId}
        AND p."isActive" = true
        AND p."alertQuantity" > 0
        AND pws.quantity <= p."alertQuantity"
    `;

    // Sales trend: last 30 days, grouped by date
    const salesTrendRaw = await prisma.$queryRaw<Array<{ day: Date; total: number; orders: bigint }>>`
      SELECT DATE_TRUNC('day', date) AS day,
             COALESCE(SUM("grandTotal"), 0)::float AS total,
             COUNT(*)::bigint AS orders
      FROM sales
      WHERE "tenantId" = ${tenantId}
        AND date >= ${trendStart}
        AND status = 'COMPLETED'
      GROUP BY day
      ORDER BY day ASC
    `;

    // Top 5 products by qty sold (last 30d)
    const topProducts = await prisma.$queryRaw<Array<{ productName: string; qty: number; revenue: number }>>`
      SELECT si."productName" AS "productName",
             SUM(si.quantity)::float AS qty,
             SUM(si.subtotal)::float AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si."saleId"
      WHERE si."tenantId" = ${tenantId}
        AND s.date >= ${trendStart}
        AND s.status = 'COMPLETED'
      GROUP BY si."productName"
      ORDER BY qty DESC
      LIMIT 5
    `;

    // Stock by warehouse (top 5 warehouses by qty)
    const stockByWarehouse = await prisma.$queryRaw<Array<{ warehouseName: string; qty: number }>>`
      SELECT w.name AS "warehouseName",
             COALESCE(SUM(pws.quantity), 0)::float AS qty
      FROM warehouses w
      LEFT JOIN product_warehouse_stocks pws ON pws."warehouseId" = w.id
      WHERE w."tenantId" = ${tenantId}
      GROUP BY w.id, w.name
      ORDER BY qty DESC
      LIMIT 5
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
      salesTrend: salesTrendRaw.map((r) => ({
        date: r.day.toISOString().slice(0, 10),
        total: Number(r.total),
        orders: Number(r.orders),
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        qty: Number(p.qty),
        revenue: Number(p.revenue),
      })),
      stockByWarehouse: stockByWarehouse.map((w) => ({
        name: w.warehouseName,
        qty: Number(w.qty),
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
