import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function SuperAdminDashboard() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    tenantCount,
    activeCount,
    suspendedCount,
    trialCount,
    activeSubCount,
    expiredCount,
    pastDueCount,
    recentSignups,
    expiringTrials,
    planUsage,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { isActive: false } }),
    prisma.tenant.count({ where: { subscriptionStatus: "TRIAL" } }),
    prisma.tenant.count({ where: { subscriptionStatus: "ACTIVE" } }),
    prisma.tenant.count({ where: { subscriptionStatus: "EXPIRED" } }),
    prisma.tenant.count({ where: { subscriptionStatus: "PAST_DUE" } }),
    prisma.tenant.findMany({
      where: { createdAt: { gte: weekAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, slug: true, email: true, createdAt: true, subscriptionStatus: true },
    }),
    prisma.tenant.findMany({
      where: {
        subscriptionStatus: "TRIAL",
        trialEndsAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) },
      },
      orderBy: { trialEndsAt: "asc" },
      take: 10,
      select: { id: true, name: true, slug: true, trialEndsAt: true },
    }),
    prisma.plan.findMany({
      include: { _count: { select: { tenants: true } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Estimate MRR from active tenants on plans
  const activeTenantsWithPlan = await prisma.tenant.findMany({
    where: { subscriptionStatus: "ACTIVE", planId: { not: null } },
    include: { plan: { select: { monthlyPrice: true } } },
  });
  const mrr = activeTenantsWithPlan.reduce((s, t) => s + Number(t.plan?.monthlyPrice ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">Total Tenants</div>
          <div className="stat-value text-primary">{tenantCount}</div>
          <div className="stat-desc">{activeCount} active, {suspendedCount} suspended</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">Trial</div>
          <div className="stat-value text-info">{trialCount}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">Active Subs</div>
          <div className="stat-value text-success">{activeSubCount}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">MRR (est.)</div>
          <div className="stat-value text-success">${mrr.toFixed(2)}</div>
          <div className="stat-desc">Monthly recurring</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">Past Due</div>
          <div className="stat-value text-warning text-lg">{pastDueCount}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">Expired</div>
          <div className="stat-value text-error text-lg">{expiredCount}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
          <div className="stat-title">Plans</div>
          <div className="stat-value text-lg">{planUsage.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-lg">Recent Signups (7 days)</h2>
              <Link href="/super-admin/tenants" className="link link-primary text-sm">All →</Link>
            </div>
            {recentSignups.length === 0 ? (
              <p className="text-base-content/50 text-sm">No new tenants this week.</p>
            ) : (
              <table className="table table-sm">
                <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recentSignups.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-base-content/60 font-mono">{t.slug}</div>
                      </td>
                      <td><span className="badge badge-sm badge-info">{t.subscriptionStatus}</span></td>
                      <td className="text-xs">{format(new Date(t.createdAt), "dd-MM HH:mm")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Trials Ending Soon</h2>
            {expiringTrials.length === 0 ? (
              <p className="text-base-content/50 text-sm">No trials ending in next 7 days.</p>
            ) : (
              <table className="table table-sm">
                <thead><tr><th>Name</th><th>Trial Ends</th></tr></thead>
                <tbody>
                  {expiringTrials.map((t) => {
                    const days = Math.ceil((new Date(t.trialEndsAt!).getTime() - now.getTime()) / 86400000);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="font-semibold">{t.name}</div>
                          <div className="text-xs text-base-content/60 font-mono">{t.slug}</div>
                        </td>
                        <td>
                          <div className="text-xs">{format(new Date(t.trialEndsAt!), "dd-MM-yyyy")}</div>
                          <div className={`text-xs ${days <= 2 ? "text-error" : "text-warning"}`}>
                            {days} day{days === 1 ? "" : "s"} left
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">Plan Distribution</h2>
            <Link href="/super-admin/plans" className="link link-primary text-sm">Manage →</Link>
          </div>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Plan</th>
                <th className="text-right">Monthly</th>
                <th className="text-right">Tenants</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {planUsage.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-right font-mono">${Number(p.monthlyPrice).toFixed(2)}</td>
                  <td className="text-right">{p._count.tenants}</td>
                  <td>{p.isActive ? <span className="badge badge-sm badge-success">Active</span> : <span className="badge badge-sm">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
