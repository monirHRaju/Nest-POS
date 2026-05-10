"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { defaultRange, RangeValue } from "@/components/reports/DateRangeFilter";
import { Column } from "@/lib/utils/export";

interface Row {
  supplierId: string | null;
  name: string;
  phone: string;
  email: string;
  purchases: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function SuppliersReportPage() {
  const [range, setRange] = useState<RangeValue>(defaultRange("last30"));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to });
    fetch(`/api/v1/reports/suppliers?${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column[] = useMemo(() => [
    { header: "Supplier", key: "name" },
    { header: "Phone", key: "phone" },
    { header: "Email", key: "email" },
    { header: "Purchases", key: "purchases", align: "right" },
    { header: "Total", key: "totalAmount", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Paid", key: "paidAmount", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Due", key: "dueAmount", align: "right", format: (v) => Number(v).toFixed(2) },
  ], []);

  const totals = rows.reduce((acc, r) => ({
    purchases: acc.purchases + r.purchases,
    totalAmount: acc.totalAmount + r.totalAmount,
    paidAmount: acc.paidAmount + r.paidAmount,
    dueAmount: acc.dueAmount + r.dueAmount,
  }), { purchases: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0 });

  return (
    <ReportShell
      title="Suppliers Report"
      subtitle={`${range.from} → ${range.to}`}
      range={range}
      onRangeChange={setRange}
      columns={columns}
      rows={(rows as unknown as Record<string, unknown>[])}
      exportFilename={`suppliers-${range.from}_${range.to}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Suppliers</div>
          <div className="stat-value text-lg">{rows.length}</div>
        </div>
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Purchases</div>
          <div className="stat-value text-lg">{totals.purchases}</div>
        </div>
        <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
          <div className="stat-title">Total</div>
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
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th className="text-right">Purchases</th>
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
                    <tr key={r.supplierId ?? `none-${i}`}>
                      <td>{r.name}</td>
                      <td>{r.phone}</td>
                      <td className="text-xs">{r.email}</td>
                      <td className="text-right">{r.purchases}</td>
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
