"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { defaultRange, RangeValue } from "@/components/reports/DateRangeFilter";
import { Column } from "@/lib/utils/export";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Daily {
  date: string;
  revenue: number;
  cogs: number;
  expenses: number;
  returns: number;
  grossProfit: number;
  netProfit: number;
}

interface Summary {
  salesCount: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  returns: number;
  expenses: number;
  netProfit: number;
  margin: number;
}

interface Resp {
  summary: Summary;
  daily: Daily[];
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function ProfitLossReportPage() {
  const [range, setRange] = useState<RangeValue>(defaultRange("thisMonth"));
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to });
    fetch(`/api/v1/reports/profit-loss?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  const columns: Column[] = useMemo(() => [
    { header: "Date", key: "date" },
    { header: "Revenue", key: "revenue", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "COGS", key: "cogs", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Gross Profit", key: "grossProfit", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Returns", key: "returns", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Expenses", key: "expenses", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Net Profit", key: "netProfit", align: "right", format: (v) => Number(v).toFixed(2) },
  ], []);

  return (
    <ReportShell
      title="Profit & Loss"
      subtitle={`${range.from} → ${range.to}`}
      range={range}
      onRangeChange={setRange}
      columns={columns}
      rows={(data?.daily as unknown as Record<string, unknown>[]) ?? []}
      exportFilename={`profit-loss-${range.from}_${range.to}`}
    >
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
              <div className="stat-title">Revenue</div>
              <div className="stat-value text-lg">{fmt(data.summary.revenue)}</div>
              <div className="stat-desc">{data.summary.salesCount} orders</div>
            </div>
            <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
              <div className="stat-title">COGS</div>
              <div className="stat-value text-lg">{fmt(data.summary.cogs)}</div>
            </div>
            <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
              <div className="stat-title">Gross Profit</div>
              <div className="stat-value text-lg text-success">{fmt(data.summary.grossProfit)}</div>
            </div>
            <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
              <div className="stat-title">Expenses</div>
              <div className="stat-value text-lg text-warning">{fmt(data.summary.expenses)}</div>
            </div>
            <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
              <div className="stat-title">Returns</div>
              <div className="stat-value text-lg text-warning">{fmt(data.summary.returns)}</div>
            </div>
            <div className="stat bg-base-100 rounded shadow-sm border border-base-200 col-span-2 md:col-span-2">
              <div className="stat-title">Net Profit</div>
              <div className={`stat-value text-2xl ${data.summary.netProfit >= 0 ? "text-success" : "text-error"}`}>
                {fmt(data.summary.netProfit)}
              </div>
              <div className="stat-desc">Margin: {data.summary.margin.toFixed(2)}%</div>
            </div>
          </div>

          {data.daily.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg">Daily Trend</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">COGS</th>
                  <th className="text-right">Gross Profit</th>
                  <th className="text-right">Returns</th>
                  <th className="text-right">Expenses</th>
                  <th className="text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                ) : data?.daily.length ? (
                  data.daily.map((r) => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td className="text-right font-mono">{fmt(r.revenue)}</td>
                      <td className="text-right font-mono">{fmt(r.cogs)}</td>
                      <td className="text-right font-mono">{fmt(r.grossProfit)}</td>
                      <td className="text-right font-mono">{fmt(r.returns)}</td>
                      <td className="text-right font-mono">{fmt(r.expenses)}</td>
                      <td className={`text-right font-mono ${r.netProfit >= 0 ? "text-success" : "text-error"}`}>{fmt(r.netProfit)}</td>
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
