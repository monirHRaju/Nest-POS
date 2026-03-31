"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { useCreateStockCountMutation } from "@/store/api/stockCountsApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import toast from "react-hot-toast";

function generateRef(): string {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `SC-${dateStr}`;
}

export default function AddStockCountPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState(generateRef);
  const [warehouseId, setWarehouseId] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 200 });
  const [createStockCount, { isLoading }] = useCreateStockCountMutation();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!warehouseId) errs.warehouseId = "Warehouse is required";
    if (!referenceNo.trim()) errs.referenceNo = "Reference number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const sc = await createStockCount({
        date,
        referenceNo,
        warehouseId,
        note: note || undefined,
      }).unwrap();
      toast.success("Stock count created");
      router.push(`/products/stock-counts/${sc.id}`);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create stock count");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">New Stock Count</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date">
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>
              <FormField label="Reference No" error={errors.referenceNo}>
                <div className="join w-full">
                  <input
                    type="text"
                    className="input input-bordered join-item flex-1"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline join-item"
                    onClick={() => setReferenceNo(generateRef())}
                    disabled={isLoading}
                  >
                    ⟳
                  </button>
                </div>
              </FormField>
            </div>

            <FormField label="Warehouse" error={errors.warehouseId} required>
              <select
                className="select select-bordered w-full"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select warehouse</option>
                {warehousesData?.data.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Note">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Optional note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isLoading}
              />
            </FormField>

            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Creating a stock count will populate all products in the selected warehouse with their current stock as expected quantities.</span>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => router.back()} className="btn btn-outline" disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading && <span className="loading loading-spinner loading-sm"></span>}
                Create &amp; Enter Counts
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
