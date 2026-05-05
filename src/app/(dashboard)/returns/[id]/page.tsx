"use client";

import { useRouter, useParams } from "next/navigation";
import { useGetReturnQuery } from "@/store/api/returnsApi";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  COMPLETED: "badge-success",
  CANCELED: "badge-error",
};

export default function ReturnDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: ret, isLoading } = useGetReturnQuery(params.id);

  if (isLoading) return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  if (!ret) return <div>Not found</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
          <h1 className="text-2xl font-bold">Return {ret.referenceNo}</h1>
          <span className={`badge ${statusColor[ret.status]}`}>{ret.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg">Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/60">Date:</span> {format(new Date(ret.date), "dd-MM-yyyy")}</div>
                <div>
                  <span className="text-base-content/60">Original Sale:</span>{" "}
                  {ret.sale ? (
                    <button
                      onClick={() => router.push(`/sales/${ret.sale!.id}`)}
                      className="link link-primary font-mono"
                    >
                      {ret.sale.referenceNo}
                    </button>
                  ) : "—"}
                </div>
                <div><span className="text-base-content/60">Customer:</span> {ret.customer?.name || "—"}</div>
                <div><span className="text-base-content/60">Reason:</span> {ret.reason || "—"}</div>
              </div>
              {ret.note && <div className="mt-3 text-sm"><span className="text-base-content/60">Note:</span> {ret.note}</div>}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <h2 className="card-title text-lg p-4 pb-0">Returned Items</h2>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ret.items?.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div>{it.productName}</div>
                          <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                        </td>
                        <td className="text-right font-mono">{Number(it.unitPrice).toFixed(2)}</td>
                        <td className="text-right">{Number(it.quantity)}</td>
                        <td className="text-right font-mono">{Number(it.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
          <div className="card-body">
            <h2 className="card-title text-lg">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">৳{Number(ret.subtotal).toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold">
                <span>Refund Total</span>
                <span className="font-mono text-warning">৳{Number(ret.grandTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
