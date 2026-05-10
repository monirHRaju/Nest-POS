"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { defaultRange, RangeValue } from "@/components/reports/DateRangeFilter";
import { Column } from "@/lib/utils/export";
import { format } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Row {
  id: string;
  date: string;
  referenceNo: string;
  category: string;
  warehouse: string;
  amount: number;
  note: string;
}

interface Resp {
  rows: Row[];
  summary: { count: number; total: number };
  byCategory: Array<{ name: string; total: number }>;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function ExpensesReportPage() {
  const [range, setRange] = useState<RangeValue>(defaultRange("thisMonth"));
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryId, setCategoryId] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings/expense-categories?pageSize=100")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to });
    if (categoryId) qs.set("categoryId", categoryId);
    fetch(`/api/v1/reports/expenses?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range, categoryId]);

  const columns: Column[] = useMemo(() => [
    { header: "Date", key: "date", format: (v) => format(new Date(v as string), "dd-MM-yyyy") },
    { header: "Reference", key: "referenceNo" },
    { header: "Category", key: "category" },
    { header: "Warehouse", key: "warehouse" },
    { header: "Amount", key: "amount", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Note", key: "note" },
  ], []);

  return (
    <ReportShell
      title="Expenses Report"
      subtitle={`${range.from} → ${range.to}`}
      range={range}
      onRangeChange={setRange}
      columns={columns}
      rows={(data?.rows as unknown as Record<string, unknown>[]) ?? []}
      exportFilename={`expenses-${range.from}_${range.to}`}
      extraFilters={
        <div>
          <label className="block text-xs text-base-content/60 mb-1">Category</label>
          <select className="select select-bordered select-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      }
    >
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-1">
            <div className="card-body">
              <h2 className="card-title text-lg">Summary</h2>
              <div className="space-y-2 text-sm mt-2">
                <div className="flex justify-between"><span>Count</span><span className="font-semibold">{data.summary.count}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total</span><span className="font-mono text-error">{fmt(data.summary.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {data.byCategory.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-2">
              <div className="card-body">
                <h2 className="card-title text-lg">By Category</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                        {data.byCategory.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th className="text-right">Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                ) : data?.rows.length ? (
                  data.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="text-xs">{format(new Date(r.date), "dd-MM-yyyy")}</td>
                      <td className="font-mono text-xs">{r.referenceNo}</td>
                      <td>{r.category}</td>
                      <td>{r.warehouse}</td>
                      <td className="text-right font-mono">{fmt(r.amount)}</td>
                      <td className="text-xs">{r.note}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center py-8 text-base-content/50">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
