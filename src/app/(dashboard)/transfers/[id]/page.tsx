"use client";

import { useRouter, useParams } from "next/navigation";
import { useGetTransferQuery, useUpdateTransferStatusMutation } from "@/store/api/transfersApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  SENT: "badge-info",
  COMPLETED: "badge-success",
  CANCELED: "badge-error",
};

export default function TransferDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: transfer, isLoading, refetch } = useGetTransferQuery(params.id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateTransferStatusMutation();

  if (isLoading) return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  if (!transfer) return <div>Not found</div>;

  const updateTo = async (status: any) => {
    if (!confirm(`Change status to ${status}?`)) return;
    try {
      await updateStatus({ id: params.id, status }).unwrap();
      toast.success("Status updated");
      refetch();
    } catch (e: any) { toast.error(e.data?.error || "Error"); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
          <h1 className="text-2xl font-bold">Transfer {transfer.referenceNo}</h1>
          <span className={`badge ${statusColor[transfer.status]}`}>{transfer.status}</span>
        </div>
        <div className="flex gap-2">
          {transfer.status === "PENDING" && (
            <button onClick={() => updateTo("SENT")} disabled={isUpdating} className="btn btn-info btn-sm">📦 Mark Sent</button>
          )}
          {(transfer.status === "PENDING" || transfer.status === "SENT") && (
            <button onClick={() => updateTo("COMPLETED")} disabled={isUpdating} className="btn btn-success btn-sm">✓ Complete</button>
          )}
          {transfer.status !== "CANCELED" && transfer.status !== "COMPLETED" && (
            <button onClick={() => updateTo("CANCELED")} disabled={isUpdating} className="btn btn-error btn-sm">✕ Cancel</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg">Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/60">Date:</span> {format(new Date(transfer.date), "dd-MM-yyyy")}</div>
                <div><span className="text-base-content/60">Items:</span> {transfer.items?.length || 0}</div>
                <div><span className="text-base-content/60">From:</span> {transfer.fromWarehouse?.name || "—"}</div>
                <div><span className="text-base-content/60">To:</span> {transfer.toWarehouse?.name || "—"}</div>
              </div>
              {transfer.note && <div className="mt-3 text-sm"><span className="text-base-content/60">Note:</span> {transfer.note}</div>}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <h2 className="card-title text-lg p-4 pb-0">Items</h2>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Unit Cost</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.items?.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div>{it.productName}</div>
                          <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                        </td>
                        <td className="text-right font-mono">{Number(it.unitCost).toFixed(2)}</td>
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
              <div className="flex justify-between"><span>Shipping</span><span className="font-mono">৳{Number(transfer.shippingCost).toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="font-mono text-primary">৳{Number(transfer.grandTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
