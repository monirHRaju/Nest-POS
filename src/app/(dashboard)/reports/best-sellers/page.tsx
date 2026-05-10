"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { defaultRange, RangeValue } from "@/components/reports/DateRangeFilter";
import { Column } from "@/lib/utils/export";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Row {
  productName: string;
  productCode: string;
  qty: number;
  revenue: number;
  orders: number;
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function BestSellersReportPage() {
  const [range, setRange] = useState<RangeValue>(defaultRange("last30"));
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to, limit: String(limit) });
    fetch(`/api/v1/reports/best-sellers?${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, [range, limit]);

  const columns: Column[] = useMemo(() => [
    { header: "Product", key: "productName" },
    { header: "Code", key: "productCode" },
    { header: "Qty Sold", key: "qty", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Orders", key: "orders", align: "right" },
    { header: "Revenue", key: "revenue", align: "right", format: (v) => Number(v).toFixed(2) },
  ], []);

  const chartData = rows.slice(0, 10);

  return (
    <ReportShell
      title="Best Sellers"
      subtitle={`${range.from} → ${range.to}`}
      range={range}
      onRangeChange={setRange}
      columns={columns}
      rows={(rows as unknown as Record<string, unknown>[])}
      exportFilename={`best-sellers-${range.from}_${range.to}`}
      extraFilters={
        <div>
          <label className="block text-xs text-base-content/60 mb-1">Top N</label>
          <select className="select select-bordered select-sm" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      }
    >
      {chartData.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Top 10 by Quantity</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="productName" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="qty" name="Units sold" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="text-right">Qty Sold</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                ) : rows.length ? (
                  rows.map((r, i) => (
                    <tr key={r.productCode}>
                      <td>{i + 1}</td>
                      <td>{r.productName}</td>
                      <td className="font-mono text-xs">{r.productCode}</td>
                      <td className="text-right font-mono">{r.qty.toFixed(2)}</td>
                      <td className="text-right font-mono">{r.orders}</td>
                      <td className="text-right font-mono">{fmt(r.revenue)}</td>
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
