"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { defaultRange, RangeValue } from "@/components/reports/DateRangeFilter";
import { Column } from "@/lib/utils/export";

interface Row {
  customerId: string | null;
  name: string;
  phone: string;
  email: string;
  orders: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CustomersReportPage() {
  const [range, setRange] = useState<RangeValue>(defaultRange("last30"));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to });
    fetch(`/api/v1/reports/customers?${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column[] = useMemo(() => [
    { header: "Customer", key: "name" },
    { header: "Phone", key: "phone" },
    { header: "Email", key: "email" },
    { header: "Orders", key: "orders", align: "right" },
    { header: "Total", key: "totalAmount", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Paid", key: "paidAmount", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Due", key: "dueAmount", align: "right", format: (v) => Number(v).toFixed(2) },
  ], []);

  const totals = rows.reduce((acc, r) => ({
    orders: acc.orders + r.orders,
    totalAmount: acc.totalAmount + r.totalAmount,
    paidAmount: acc.paidAmount + r.paidAmount,
    dueAmount: acc.dueAmount + r.dueAmount,
  }), { orders: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0 });

  return (
    <ReportShell
      title="Customers Report"
      subtitle={`${range.from} → ${range.to}`}
      range={range}
      onRangeChange={setRange}
      columns={columns}
      rows={(rows as unknown as Record<string, unknown>[])}
      exportFilename={`customers-${range.from}_${range.to}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Customers</div>
          <div className="stat-value text-lg">{rows.length}</div>
        </div>
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Orders</div>
          <div className="stat-value text-lg">{totals.orders}</div>
        </div>
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Revenue</div>
          <div className="stat-value text-lg">{fmt(totals.totalAmount)}</div>
        </div>
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Outstanding</div>
          <div className="stat-value text-lg text-warning">{fmt(totals.dueAmount)}</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Due</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                ) : rows.length ? (
                  rows.map((r, i) => (
                    <tr key={r.customerId ?? `walk-${i}`}>
                      <td>{r.name}</td>
                      <td>{r.phone}</td>
                      <td className="text-xs">{r.email}</td>
                      <td className="text-right">{r.orders}</td>
                      <td className="text-right font-mono">{fmt(r.totalAmount)}</td>
                      <td className="text-right font-mono">{fmt(r.paidAmount)}</td>
                      <td className="text-right font-mono">{fmt(r.dueAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="text-center py-8 text-base-content/50">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
