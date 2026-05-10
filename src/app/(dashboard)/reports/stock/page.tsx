"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { Column } from "@/lib/utils/export";

interface Row {
  productId: string;
  productName: string;
  productCode: string;
  warehouseName: string | null;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  alertQuantity: number;
  stockValue: number;
}

interface Resp {
  rows: Row[];
  summary: { count: number; totalQty: number; totalValue: number };
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function StockReportPage() {
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings/warehouses?pageSize=100")
      .then((r) => r.json())
      .then((d) => setWarehouses(d.data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (warehouseId) qs.set("warehouseId", warehouseId);
    if (lowOnly) qs.set("lowOnly", "1");
    fetch(`/api/v1/reports/stock?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [warehouseId, lowOnly]);

  const columns: Column[] = useMemo(() => [
    { header: "Product", key: "productName" },
    { header: "Code", key: "productCode" },
    { header: "Warehouse", key: "warehouseName" },
    { header: "Quantity", key: "quantity", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Alert Qty", key: "alertQuantity", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Cost", key: "costPrice", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Selling", key: "sellingPrice", align: "right", format: (v) => Number(v).toFixed(2) },
    { header: "Stock Value", key: "stockValue", align: "right", format: (v) => Number(v).toFixed(2) },
  ], []);

  return (
    <ReportShell
      title="Stock Report"
      columns={columns}
      rows={(data?.rows as unknown as Record<string, unknown>[]) ?? []}
      exportFilename="stock-report"
      extraFilters={
        <>
          <div>
            <label className="block text-xs text-base-content/60 mb-1">Warehouse</label>
            <select className="select select-bordered select-sm" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">All</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <label className="cursor-pointer flex items-center gap-2 mt-5">
            <input type="checkbox" className="checkbox checkbox-sm" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            <span className="text-sm">Low stock only</span>
          </label>
        </>
      }
    >
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
            <div className="stat-title">Items</div>
            <div className="stat-value text-lg">{data.summary.count}</div>
          </div>
          <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
            <div className="stat-title">Total Quantity</div>
            <div className="stat-value text-lg">{data.summary.totalQty.toFixed(2)}</div>
          </div>
          <div className="stat bg-base-100 rounded shadow-sm border border-base-200">
            <div className="stat-title">Total Value</div>
            <div className="stat-value text-lg">{fmt(data.summary.totalValue)}</div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Warehouse</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Alert</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Selling</th>
                  <th className="text-right">Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
                ) : data?.rows.length ? (
                  data.rows.map((r, i) => {
                    const low = Number(r.alertQuantity) > 0 && Number(r.quantity) <= Number(r.alertQuantity);
                    return (
                      <tr key={`${r.productId}-${r.warehouseName}-${i}`} className={low ? "bg-error/10" : ""}>
                        <td>{r.productName}</td>
                        <td className="font-mono text-xs">{r.productCode}</td>
                        <td>{r.warehouseName ?? "—"}</td>
                        <td className="text-right font-mono">{Number(r.quantity).toFixed(2)}</td>
                        <td className="text-right font-mono">{Number(r.alertQuantity).toFixed(2)}</td>
                        <td className="text-right font-mono">{fmt(Number(r.costPrice))}</td>
                        <td className="text-right font-mono">{fmt(Number(r.sellingPrice))}</td>
                        <td className="text-right font-mono">{fmt(Number(r.stockValue))}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={8} className="text-center py-8 text-base-content/50">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
