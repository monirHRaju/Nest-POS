import { prisma } from "@/lib/prisma";

export default async function SuperAdminDashboard() {
  const [tenantCount, activeCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Total Tenants</div>
          <div className="stat-value text-primary">{tenantCount}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">Active Tenants</div>
          <div className="stat-value text-success">{activeCount}</div>
        </div>
      </div>
    </div>
  );
}
