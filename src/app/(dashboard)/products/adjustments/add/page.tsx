"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { useCreateAdjustmentMutation, AdjustmentType } from "@/store/api/adjustmentsApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import { useGetProductsQuery, Product } from "@/store/api/productsApi";
import toast from "react-hot-toast";

interface AdjustmentItemRow {
  productId: string;
  product: Product | null;
  quantity: number;
}

function generateRef(): string {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `ADJ-${dateStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export default function AddAdjustmentPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState(generateRef);
  const [warehouseId, setWarehouseId] = useState("");
  const [type, setType] = useState<AdjustmentType>("ADDITION");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<AdjustmentItemRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 200 });
  const { data: productsData } = useGetProductsQuery(
    { search: productSearch, pageSize: 10 },
    { skip: productSearch.length < 2 }
  );
  const [createAdjustment, { isLoading }] = useCreateAdjustmentMutation();

  const addItem = (product: Product) => {
    if (items.some((i) => i.productId === product.id)) {
      toast("Product already added");
      return;
    }
    setItems((prev) => [...prev, { productId: product.id, product, quantity: 1 }]);
    setProductSearch("");
  };

  const updateQty = (idx: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, quantity: qty } : item)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!warehouseId) errs.warehouseId = "Warehouse is required";
    if (!referenceNo.trim()) errs.referenceNo = "Reference number is required";
    if (items.length === 0) errs.items = "Add at least one product";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createAdjustment({
        date,
        referenceNo,
        warehouseId,
        type,
        note: note || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }).unwrap();
      toast.success("Adjustment created");
      router.push("/products/adjustments");
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to create adjustment");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">New Stock Adjustment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <FormField label="Adjustment Type">
                <select
                  className="select select-bordered w-full"
                  value={type}
                  onChange={(e) => setType(e.target.value as AdjustmentType)}
                  disabled={isLoading}
                >
                  <option value="ADDITION">Addition (+)</option>
                  <option value="SUBTRACTION">Subtraction (-)</option>
                </select>
              </FormField>
            </div>
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
          </div>
        </div>

        {/* Product Search */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Add Products</h2>
            {errors.items && <p className="text-error text-sm">{errors.items}</p>}
            <div className="relative">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Type product name or code to search..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productSearch.length >= 2 && productsData?.data && productsData.data.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full bg-base-100 border border-base-200 rounded-box shadow-lg max-h-60 overflow-y-auto">
                  {productsData.data.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-base-200 flex justify-between"
                        onClick={() => addItem(p)}
                      >
                        <span>{p.name}</span>
                        <span className="text-base-content/60 font-mono text-sm">{p.code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Product</th>
                      <th>Code</th>
                      <th>Unit</th>
                      <th className="w-32">Quantity</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.productId}>
                        <td>{item.product?.name}</td>
                        <td className="font-mono text-sm">{item.product?.code}</td>
                        <td>{item.product?.unit?.shortName || "—"}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="input input-bordered input-sm w-28"
                            value={item.quantity}
                            onChange={(e) => updateQty(idx, parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => removeItem(idx)}
                            disabled={isLoading}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.back()} className="btn btn-outline" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading && <span className="loading loading-spinner loading-sm"></span>}
            Create Adjustment
          </button>
        </div>
      </form>
    </div>
  );
}
