"use client";

import Link from "next/link";
import { useGetAdjustmentQuery } from "@/store/api/adjustmentsApi";

export default function AdjustmentDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useGetAdjustmentQuery(params.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-base-content/60">Adjustment not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/products/adjustments" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Adjustment: {data.referenceNo}</h1>
        <span className={`badge ${data.type === "ADDITION" ? "badge-success" : "badge-error"}`}>
          {data.type.charAt(0) + data.type.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4">
            <p className="text-sm text-base-content/60">Date</p>
            <p className="font-semibold">{new Date(data.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4">
            <p className="text-sm text-base-content/60">Warehouse</p>
            <p className="font-semibold">{data.warehouse?.name || "—"}</p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4">
            <p className="text-sm text-base-content/60">Note</p>
            <p className="font-semibold">{data.note || "—"}</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base">Items</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200">
                  <th>Product</th>
                  <th>Code</th>
                  <th>Unit</th>
                  <th className="text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || "—"}</td>
                    <td className="font-mono text-sm">{item.product?.code || "—"}</td>
                    <td>{item.product?.unit?.shortName || "—"}</td>
                    <td className="text-right font-semibold">{Number(item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
