"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useGetStockCountQuery,
  useUpdateStockCountItemsMutation,
  useFinalizeStockCountMutation,
} from "@/store/api/stockCountsApi";
import toast from "react-hot-toast";

export default function StockCountDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, isLoading } = useGetStockCountQuery(params.id);
  const [updateItems, { isLoading: isUpdating }] = useUpdateStockCountItemsMutation();
  const [finalize, { isLoading: isFinalizing }] = useFinalizeStockCountMutation();
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  // Local counted quantities state
  const [countedQtys, setCountedQtys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-base-content/60">Stock count not found</div>;
  }

  const isCompleted = data.status === "COMPLETED";

  const getQty = (itemId: string, fallback: number | null) => {
    if (countedQtys[itemId] !== undefined) return countedQtys[itemId];
    return fallback !== null ? String(fallback) : "";
  };

  const handleSave = async () => {
    const items = (data.items ?? []).map((item) => ({
      id: item.id,
      countedQty: parseFloat(getQty(item.id, item.countedQty) || "0") || 0,
    }));

    try {
      await updateItems({ id: params.id, items }).unwrap();
      toast.success("Counts saved");
      setSaved(true);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save");
    }
  };

  const handleFinalize = async () => {
    try {
      const result = await finalize(params.id).unwrap();
      toast.success(
        result.adjustmentsCreated
          ? "Stock count finalized and adjustments created"
          : "Stock count finalized — no discrepancies found"
      );
      setShowFinalizeConfirm(false);
      router.push("/products/stock-counts");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to finalize");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Stock Count: {data.referenceNo}</h1>
          <span className={`badge ${
            data.status === "COMPLETED" ? "badge-success" :
            data.status === "IN_PROGRESS" ? "badge-info" : "badge-warning"
          }`}>
            {data.status === "IN_PROGRESS" ? "In Progress" :
             data.status === "COMPLETED" ? "Completed" : "Pending"}
          </span>
        </div>
        {!isCompleted && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="btn btn-outline btn-sm"
              disabled={isUpdating || isFinalizing}
            >
              {isUpdating && <span className="loading loading-spinner loading-xs"></span>}
              Save Progress
            </button>
            <button
              onClick={() => setShowFinalizeConfirm(true)}
              className="btn btn-primary btn-sm"
              disabled={isUpdating || isFinalizing}
            >
              Finalize Count
            </button>
          </div>
        )}
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
            <p className="text-sm text-base-content/60">Products</p>
            <p className="font-semibold">{data.items?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {saved && !isCompleted && (
        <div className="alert alert-success mb-4">
          <span>Progress saved. Click "Finalize Count" when you are done counting.</span>
        </div>
      )}

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200">
                  <th>Product</th>
                  <th>Code</th>
                  <th>Unit</th>
                  <th className="text-right">Expected</th>
                  <th className="text-right">Counted</th>
                  {isCompleted && <th className="text-right">Difference</th>}
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item) => {
                  const counted = getQty(item.id, item.countedQty);
                  const diff = counted !== ""
                    ? parseFloat(counted) - Number(item.expectedQty)
                    : null;

                  return (
                    <tr key={item.id} className={diff !== null && diff !== 0 ? "bg-warning/10" : ""}>
                      <td>{item.product?.name || "—"}</td>
                      <td className="font-mono text-sm">{item.product?.code || "—"}</td>
                      <td>{item.product?.unit?.shortName || "—"}</td>
                      <td className="text-right">{Number(item.expectedQty).toFixed(2)}</td>
                      <td className="text-right">
                        {isCompleted ? (
                          <span>{item.countedQty !== null ? Number(item.countedQty).toFixed(2) : "—"}</span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input input-bordered input-sm w-24 text-right"
                            value={counted}
                            onChange={(e) =>
                              setCountedQtys((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            placeholder={String(Number(item.expectedQty).toFixed(2))}
                          />
                        )}
                      </td>
                      {isCompleted && (
                        <td className={`text-right font-semibold ${
                          Number(item.difference) > 0 ? "text-success" :
                          Number(item.difference) < 0 ? "text-error" : ""
                        }`}>
                          {item.difference !== null
                            ? (Number(item.difference) > 0 ? "+" : "") + Number(item.difference).toFixed(2)
                            : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showFinalizeConfirm}
        title="Finalize Stock Count"
        message="This will generate stock adjustments for any discrepancies and mark the count as completed. This cannot be undone."
        onConfirm={handleFinalize}
        onCancel={() => setShowFinalizeConfirm(false)}
        confirmText="Finalize"
        loading={isFinalizing}
      />
    </div>
  );
}
