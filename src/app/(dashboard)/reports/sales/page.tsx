"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { defaultRange, RangeValue } from "@/components/reports/DateRangeFilter";
import { Column } from "@/lib/utils/export";
import { format } from "date-fns";

interface Row {
  id: string;
  date: string;
  referenceNo: string;
  customer: string;
  warehouse: string;
  biller: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  paidAmount: number;
  due: number;
}

interface Resp {
  rows: Row[];
  summary: { count: number; grandTotal: number; paidAmount: number };
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function SalesReportPage() {
  const [range, setRange] = useState<RangeValue>(defaultRange("last30"));
  const [status, setStatus] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to });
    if (status) qs.set("status", status);
    fetch(`/api/v1/reports/sales?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range, status]);

  const columns: Column[] = useMemo(() => [
    { header: "Date", key: "date", format: (v) => format(new Date(v as string), "dd-MM-yyyy HH:mm") },
    { header: "Reference", key: "referenceNo" },
    { header: "Customer", key: "customer" },
    { header: "Warehouse", key: "warehouse" },
    { header: "Biller", key: "biller" },
    { header: "Status", key: "status" },
    { header: "Payment", key: "paymentStatus" },
    { header: "Grand Total", key: "grandTotal", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Paid", key: "paidAmount", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Due", key: "due", align: "right", format: (v) => Number(v).toFixed(2) },
  ], []);

  return (
    <ReportShell
      title="Sales Report"
      subtitle={`${range.from} → ${range.to}`}
      range={range}
      onRangeChange={setRange}
      columns={columns}
      rows={(data?.rows as unknown as Record<string, unknown>[]) ?? []}
      exportFilename={`sales-${range.from}_${range.to}`}
      extraFilters={
        <div>
          <label className="block text-xs text-base-content/60 mb-1">Status</label>
          <select className="select select-bordered select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      }
    >
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
            <div className="stat-title">Total Sales</div>
            <div className="stat-value text-lg">{data.summary.count}</div>
          </div>
          <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
            <div className="stat-title">Grand Total</div>
            <div className="stat-value text-lg">{fmt(data.summary.grandTotal)}</div>
          </div>
          <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
            <div className="stat-title">Paid</div>
            <div className="stat-value text-lg">{fmt(data.summary.paidAmount)}</div>
          </div>
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
                  <th>Customer</th>
                  <th>Warehouse</th>
                  <th>Biller</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="text-right">Grand Total</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Due</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
                ) : data?.rows.length ? (
                  data.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="text-xs">{format(new Date(r.date), "dd-MM-yyyy HH:mm")}</td>
                      <td className="font-mono text-xs">{r.referenceNo}</td>
                      <td>{r.customer}</td>
                      <td>{r.warehouse}</td>
                      <td>{r.biller}</td>
                      <td><span className="badge badge-sm">{r.status}</span></td>
                      <td><span className="badge badge-sm badge-outline">{r.paymentStatus}</span></td>
                      <td className="text-right font-mono">{fmt(r.grandTotal)}</td>
                      <td className="text-right font-mono">{fmt(r.paidAmount)}</td>
                      <td className="text-right font-mono">{fmt(r.due)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={10} className="text-center py-8 text-base-content/50">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
