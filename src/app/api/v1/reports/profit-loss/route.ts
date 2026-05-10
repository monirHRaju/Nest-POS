import { getAuthenticatedUser } from "@/lib/api-auth";
import { ok, error } from "@/lib/api-response";
import { rangeFromSearchParams } from "@/lib/utils/date-range";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return error("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const { from, to } = rangeFromSearchParams(url);
    const tenantId = user.tenantId;

    const [revenueAgg, returnsAgg, expensesAgg, cogsAgg, daily] = await Promise.all([
      user.db.sale.aggregate({
        where: { date: { gte: from, lte: to }, status: "COMPLETED" },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      user.db.return.aggregate({
        where: { date: { gte: from, lte: to }, status: "COMPLETED" },
        _sum: { grandTotal: true },
      }),
      user.db.expense.aggregate({
        where: { date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<[{ cogs: number }]>`
        SELECT COALESCE(SUM(si.quantity * p."costPrice"), 0)::float AS cogs
        FROM sale_items si
        JOIN sales s ON s.id = si."saleId"
        JOIN products p ON p.id = si."productId"
        WHERE si."tenantId" = ${tenantId}
          AND s.date >= ${from}
          AND s.date <= ${to}
          AND s.status = 'COMPLETED'
      `,
      prisma.$queryRaw<Array<{ day: Date; revenue: number; cogs: number; expenses: number; returns: number }>>`
        WITH days AS (
          SELECT generate_series(date_trunc('day', ${from}::timestamp), date_trunc('day', ${to}::timestamp), '1 day')::date AS day
        ),
        rev AS (
          SELECT date_trunc('day', date)::date AS day, SUM("grandTotal")::float AS amt
          FROM sales WHERE "tenantId" = ${tenantId} AND date >= ${from} AND date <= ${to} AND status = 'COMPLETED'
          GROUP BY 1
        ),
        cogs AS (
          SELECT date_trunc('day', s.date)::date AS day, SUM(si.quantity * p."costPrice")::float AS amt
          FROM sale_items si
          JOIN sales s ON s.id = si."saleId"
          JOIN products p ON p.id = si."productId"
          WHERE si."tenantId" = ${tenantId} AND s.date >= ${from} AND s.date <= ${to} AND s.status = 'COMPLETED'
          GROUP BY 1
        ),
        exp AS (
          SELECT date_trunc('day', date)::date AS day, SUM(amount)::float AS amt
          FROM expenses WHERE "tenantId" = ${tenantId} AND date >= ${from} AND date <= ${to}
          GROUP BY 1
        ),
        ret AS (
          SELECT date_trunc('day', date)::date AS day, SUM("grandTotal")::float AS amt
          FROM returns WHERE "tenantId" = ${tenantId} AND date >= ${from} AND date <= ${to} AND status = 'COMPLETED'
          GROUP BY 1
        )
        SELECT d.day,
               COALESCE(rev.amt, 0) AS revenue,
               COALESCE(cogs.amt, 0) AS cogs,
               COALESCE(exp.amt, 0) AS expenses,
               COALESCE(ret.amt, 0) AS returns
        FROM days d
        LEFT JOIN rev ON rev.day = d.day
        LEFT JOIN cogs ON cogs.day = d.day
        LEFT JOIN exp ON exp.day = d.day
        LEFT JOIN ret ON ret.day = d.day
        ORDER BY d.day ASC
      `,
    ]);

    const revenue = Number(revenueAgg._sum.grandTotal ?? 0);
    const returnsAmt = Number(returnsAgg._sum.grandTotal ?? 0);
    const expenses = Number(expensesAgg._sum.amount ?? 0);
    const cogs = Number(cogsAgg[0]?.cogs ?? 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - returnsAmt - expenses;

    return ok({
      summary: {
        salesCount: revenueAgg._count._all,
        revenue,
        cogs,
        grossProfit,
        returns: returnsAmt,
        expenses,
        netProfit,
        margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      },
      daily: daily.map((d) => ({
        date: d.day.toISOString().slice(0, 10),
        revenue: Number(d.revenue),
        cogs: Number(d.cogs),
        expenses: Number(d.expenses),
        returns: Number(d.returns),
        grossProfit: Number(d.revenue) - Number(d.cogs),
        netProfit: Number(d.revenue) - Number(d.cogs) - Number(d.expenses) - Number(d.returns),
      })),
    });
  } catch (e) {
    console.error("P&L report error:", e);
    return error("Internal server error", 500);
  }
}
