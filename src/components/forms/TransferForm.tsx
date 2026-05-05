"use client";

import { useState, useMemo } from "react";
import { FormField } from "@/components/ui/FormField";
import { ProductSearchSelect } from "@/components/ui/ProductSearchSelect";
import { TransferInput, TransferStatus } from "@/store/api/transfersApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import { Product } from "@/store/api/productsApi";
import { format } from "date-fns";

interface Props {
  onSubmit: (data: TransferInput) => Promise<void>;
  loading?: boolean;
}

interface LineItem {
  _localId: string;
  productId: string;
  productName: string;
  productCode: string;
  unitCost: number;
  quantity: number;
  subtotal: number;
}

const STATUSES: TransferStatus[] = ["PENDING", "SENT", "COMPLETED", "CANCELED"];

export function TransferForm({ onSubmit, loading = false }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [status, setStatus] = useState<TransferStatus>("PENDING");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 100 });

  const addProduct = (p: Product) => {
    const existing = items.find((it) => it.productId === p.id);
    if (existing) {
      updateItem(existing._localId, { quantity: existing.quantity + 1 });
      return;
    }
    const cost = Number(p.costPrice) || 0;
    setItems([...items, {
      _localId: `new-${Date.now()}-${Math.random()}`,
      productId: p.id,
      productName: p.name,
      productCode: p.code,
      unitCost: cost,
      quantity: 1,
      subtotal: cost,
    }]);
  };

  const updateItem = (localId: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => {
      if (it._localId !== localId) return it;
      const next = { ...it, ...patch };
      next.subtotal = next.unitCost * next.quantity;
      return next;
    }));
  };

  const removeItem = (localId: string) => setItems(items.filter((it) => it._localId !== localId));

  const totals = useMemo(() => {
    const itemsTotal = items.reduce((sum, it) => sum + it.subtotal, 0);
    const grandTotal = itemsTotal + shippingCost;
    return { itemsTotal, grandTotal };
  }, [items, shippingCost]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!fromWarehouseId) e.fromWarehouseId = "Required";
    if (!toWarehouseId) e.toWarehouseId = "Required";
    if (fromWarehouseId === toWarehouseId) e.toWarehouseId = "Must differ from source";
    if (items.length === 0) e.items = "Add at least 1 item";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: TransferInput = {
      date,
      fromWarehouseId,
      toWarehouseId,
      shippingCost,
      grandTotal: totals.grandTotal,
      status,
      note: note || null,
      items: items.map(({ _localId, ...rest }) => rest),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-2">Transfer Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Date" required>
              <input type="date" className="input input-bordered w-full" value={date}
                onChange={(e) => setDate(e.target.value)} disabled={loading} />
            </FormField>
            <FormField label="From Warehouse" error={errors.fromWarehouseId} required>
              <select className="select select-bordered w-full" value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)} disabled={loading}>
                <option value="">— Select —</option>
                {warehousesData?.data?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </FormField>
            <FormField label="To Warehouse" error={errors.toWarehouseId} required>
              <select className="select select-bordered w-full" value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)} disabled={loading}>
                <option value="">— Select —</option>
                {warehousesData?.data?.map((w: any) => <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>{w.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status" required>
              <select className="select select-bordered w-full" value={status}
                onChange={(e) => setStatus(e.target.value as TransferStatus)} disabled={loading}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-2">Add Products</h2>
          <ProductSearchSelect onSelect={addProduct} disabled={loading} />
          {errors.items && <p className="text-error text-sm mt-2">{errors.items}</p>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Unit Cost</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it._localId}>
                      <td>
                        <div>{it.productName}</div>
                        <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01"
                          className="input input-bordered input-sm w-24 text-right"
                          value={it.unitCost}
                          onChange={(e) => updateItem(it._localId, { unitCost: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td>
                        <input type="number" min="1" step="1"
                          className="input input-bordered input-sm w-20 text-right"
                          value={it.quantity}
                          onChange={(e) => updateItem(it._localId, { quantity: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td className="text-right font-mono">{it.subtotal.toFixed(2)}</td>
                      <td>
                        <button type="button" onClick={() => removeItem(it._localId)} className="btn btn-ghost btn-xs text-error">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg mb-2">Extra</h2>
            <FormField label="Shipping Cost">
              <input type="number" min="0" step="0.01" className="input input-bordered w-full"
                value={shippingCost} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} disabled={loading} />
            </FormField>
            <FormField label="Note">
              <textarea className="textarea textarea-bordered w-full" rows={3}
                value={note} onChange={(e) => setNote(e.target.value)} disabled={loading} />
            </FormField>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg mb-2">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Items Total</span><span className="font-mono">৳{totals.itemsTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-mono">৳{shippingCost.toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="font-mono text-primary">৳{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Create Transfer
        </button>
      </div>
    </form>
  );
}
