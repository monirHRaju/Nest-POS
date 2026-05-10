"use client";

import Link from "next/link";

interface ReportLink {
  href: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

const REPORTS: ReportLink[] = [
  {
    href: "/reports/sales",
    title: "Sales Report",
    desc: "Sales transactions with date filtering, status, and totals.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
    color: "text-info",
  },
  {
    href: "/reports/purchases",
    title: "Purchases Report",
    desc: "Purchases by date, supplier, status, and payment.",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17",
    color: "text-success",
  },
  {
    href: "/reports/stock",
    title: "Stock Report",
    desc: "Current product stock per warehouse, value, low-stock filter.",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10",
    color: "text-primary",
  },
  {
    href: "/reports/best-sellers",
    title: "Best Sellers",
    desc: "Top selling products by quantity and revenue.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "text-warning",
  },
  {
    href: "/reports/customers",
    title: "Customers Report",
    desc: "Sales aggregated per customer with outstanding dues.",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    color: "text-secondary",
  },
  {
    href: "/reports/suppliers",
    title: "Suppliers Report",
    desc: "Purchases aggregated per supplier with outstanding dues.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857",
    color: "text-accent",
  },
  {
    href: "/reports/profit-loss",
    title: "Profit & Loss",
    desc: "Revenue, COGS, expenses, returns, net profit with trend chart.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10",
    color: "text-success",
  },
  {
    href: "/reports/expenses",
    title: "Expenses Report",
    desc: "Expenses by category and date with breakdown chart.",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9",
    color: "text-error",
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-base-content/60">Analytics and exports across all modules.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-primary transition-all"
          >
            <div className="card-body p-5">
              <div className={`${r.color} mb-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
                </svg>
              </div>
              <h2 className="card-title text-base">{r.title}</h2>
              <p className="text-sm text-base-content/60">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
