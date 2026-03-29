"use client";

import { useCurrentSession } from "@/lib/hooks/useSession";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface DashboardStats {
  todaySales: number;
  todayPurchases: number;
  todayReturns: number;
  todayExpenses: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
  recentSales: Array<{
    id: string;
    referenceNo: string;
    grandTotal: string;
    createdAt: string;
    customerName: string;
  }>;
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`card bg-${color} text-${color}-content shadow-md`}>
      <div className="card-body p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={icon}
              />
            </svg>
          </div>
        </div>
        <p className="text-xs mt-2 opacity-70">Today</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useCurrentSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/dashboard")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card bg-base-100 shadow-md">
              <div className="card-body p-5">
                <div className="skeleton h-4 w-24"></div>
                <div className="skeleton h-8 w-20 mt-2"></div>
                <div className="skeleton h-3 w-16 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currencySymbol = "৳";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome, {user?.firstName}!
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`${currencySymbol}${(stats?.todaySales ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          color="info"
        />
        <StatCard
          title="Today's Purchases"
          value={`${currencySymbol}${(stats?.todayPurchases ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          color="success"
        />
        <StatCard
          title="Today's Returns"
          value={`${currencySymbol}${(stats?.todayReturns ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
          color="warning"
        />
        <StatCard
          title="Today's Expenses"
          value={`${currencySymbol}${(stats?.todayExpenses ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          color="error"
        />
      </div>

      {/* Summary + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-lg">Quick Stats</h2>
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Total Products</span>
                <span className="badge badge-primary badge-lg">{stats?.totalProducts ?? 0}</span>
              </div>
              <div className="divider my-0"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Total Customers</span>
                <span className="badge badge-secondary badge-lg">{stats?.totalCustomers ?? 0}</span>
              </div>
              <div className="divider my-0"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Low Stock Alerts</span>
                <span className="badge badge-error badge-lg">{stats?.lowStockCount ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg">Latest Sales</h2>
            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentSales && stats.recentSales.length > 0 ? (
                    stats.recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="font-mono text-sm">{sale.referenceNo}</td>
                        <td>{sale.customerName}</td>
                        <td>
                          {currencySymbol}
                          {parseFloat(sale.grandTotal).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-sm text-base-content/70">
                          {format(new Date(sale.createdAt), "dd-MM-yyyy HH:mm")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-base-content/50 py-8">
                        No sales yet. Start by making a sale from the POS!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
