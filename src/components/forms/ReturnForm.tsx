"use client";

import { useState, useEffect, useMemo } from "react";
import { FormField } from "@/components/ui/FormField";
import { useGetSalesQuery, useGetSaleQuery } from "@/store/api/salesApi";
import { ReturnInput } from "@/store/api/returnsApi";
import { format } from "date-fns";

interface Props {
  onSubmit: (data: ReturnInput) => Promise<void>;
  loading?: boolean;
}

interface LineItem {
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  maxQty: number;
  quantity: number;
}

export function ReturnForm({ onSubmit, loading = false }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saleId, setSaleId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: salesData } = useGetSalesQuery({ pageSize: 50, status: "COMPLETED" });
  const { data: sale } = useGetSaleQuery(saleId, { skip: !saleId });

  useEffect(() => {
    if (sale && sale.items) {
      setItems(sale.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode,
        unitPrice: Number(it.unitPrice),
        maxQty: Number(it.quantity),
        quantity: 0,
      })));
    } else {
      setItems([]);
    }
  }, [sale]);

  const totals = useMemo(() => {
    const active = items.filter((it) => it.quantity > 0);
    const subtotal = active.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    return { subtotal, grandTotal: subtotal, count: active.length };
  }, [items]);

  const updateQty = (productId: string, q: number) => {
    setItems((prev) => prev.map((it) =>
      it.productId === productId
        ? { ...it, quantity: Math.max(0, Math.min(it.maxQty, q)) }
        : it
    ));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!saleId) e.saleId = "Select a sale";
    if (totals.count === 0) e.items = "Select qty for at least 1 item";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: ReturnInput = {
      date,
      saleId,
      customerId: sale?.customerId,
      items: items
        .filter((it) => it.quantity > 0)
        .map((it) => ({
          productId: it.productId,
          productName: it.productName,
          productCode: it.productCode,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          subtotal: it.unitPrice * it.quantity,
        })),
      subtotal: totals.subtotal,
      grandTotal: totals.grandTotal,
      status: "COMPLETED",
      reason: reason || null,
      note: note || null,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-2">Return Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Date" required>
              <input type="date" className="input input-bordered w-full" value={date}
                onChange={(e) => setDate(e.target.value)} disabled={loading} />
            </FormField>
            <FormField label="Original Sale" error={errors.saleId} required>
              <select className="select select-bordered w-full" value={saleId}
                onChange={(e) => setSaleId(e.target.value)} disabled={loading}>
                <option value="">— Select sale —</option>
                {salesData?.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.referenceNo} — {s.customer?.name || "Walk-in"} — ৳{Number(s.grandTotal).toFixed(2)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      </div>

      {sale && items.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-0">
            <h2 className="card-title text-lg p-4 pb-0">Items to Return</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Sold Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Return Qty</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.productId}>
                      <td>
                        <div>{it.productName}</div>
                        <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                      </td>
                      <td className="text-right">{it.maxQty}</td>
                      <td className="text-right font-mono">{it.unitPrice.toFixed(2)}</td>
                      <td className="text-right">
                        <input type="number" min="0" max={it.maxQty} step="1"
                          className="input input-bordered input-sm w-20 text-right"
                          value={it.quantity}
                          onChange={(e) => updateQty(it.productId, parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="text-right font-mono">{(it.unitPrice * it.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.items && <p className="text-error text-sm p-4">{errors.items}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg mb-2">Reason & Note</h2>
            <FormField label="Reason">
              <input className="input input-bordered w-full" value={reason}
                onChange={(e) => setReason(e.target.value)} disabled={loading}
                placeholder="e.g., Defective, Wrong item" />
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
              <div className="flex justify-between"><span>Items returning</span><span>{totals.count}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">৳{totals.subtotal.toFixed(2)}</span></div>
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
        <button type="submit" className="btn btn-primary" disabled={loading || totals.count === 0}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Create Return
        </button>
      </div>
    </form>
  );
}
