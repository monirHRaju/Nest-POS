"use client";

import { useState, useEffect, useMemo } from "react";
import { FormField } from "@/components/ui/FormField";
import { ProductSearchSelect } from "@/components/ui/ProductSearchSelect";
import { Quotation, QuotationInput, QuotationStatus } from "@/store/api/quotationsApi";
import { useGetCustomersQuery } from "@/store/api/customersApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import { Product } from "@/store/api/productsApi";
import { format } from "date-fns";

interface Props {
  quotation?: Quotation;
  onSubmit: (data: QuotationInput) => Promise<void>;
  loading?: boolean;
}

interface LineItem {
  _localId: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
}

const STATUSES: QuotationStatus[] = ["PENDING", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

export function QuotationForm({ quotation, onSubmit, loading = false }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expiryDate, setExpiryDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [status, setStatus] = useState<QuotationStatus>("PENDING");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customersData } = useGetCustomersQuery({ pageSize: 200 });
  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 100 });

  useEffect(() => {
    if (quotation) {
      setDate(format(new Date(quotation.date), "yyyy-MM-dd"));
      setExpiryDate(quotation.expiryDate ? format(new Date(quotation.expiryDate), "yyyy-MM-dd") : "");
      setCustomerId(quotation.customerId || "");
      setWarehouseId(quotation.warehouseId || "");
      setDiscount(Number(quotation.discount) || 0);
      setDiscountType(quotation.discountType);
      setStatus(quotation.status);
      setNote(quotation.note || "");
      setItems((quotation.items || []).map((it, idx) => ({
        _localId: `${idx}-${it.id}`,
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode,
        unitPrice: Number(it.unitPrice),
        quantity: Number(it.quantity),
        discount: Number(it.discount),
        taxRate: Number(it.taxRate),
        taxAmount: Number(it.taxAmount),
        subtotal: Number(it.subtotal),
      })));
    }
  }, [quotation]);

  const addProduct = (p: Product) => {
    const existing = items.find((it) => it.productId === p.id);
    if (existing) {
      updateItem(existing._localId, { quantity: existing.quantity + 1 });
      return;
    }
    const price = Number(p.sellingPrice) || 0;
    setItems([...items, {
      _localId: `new-${Date.now()}-${Math.random()}`,
      productId: p.id,
      productName: p.name,
      productCode: p.code,
      unitPrice: price,
      quantity: 1,
      discount: 0,
      taxRate: Number(p.tax?.rate) || 0,
      taxAmount: 0,
      subtotal: price,
    }]);
  };

  const updateItem = (localId: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => {
      if (it._localId !== localId) return it;
      const next = { ...it, ...patch };
      const lineGross = next.unitPrice * next.quantity;
      const lineNet = Math.max(0, lineGross - (Number(next.discount) || 0));
      const taxAmount = (lineNet * (Number(next.taxRate) || 0)) / 100;
      next.taxAmount = taxAmount;
      next.subtotal = lineNet + taxAmount;
      return next;
    }));
  };

  const removeItem = (localId: string) => setItems(items.filter((it) => it._localId !== localId));

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
    const discAmount = discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
    const grandTotal = Math.max(0, subtotal - discAmount);
    return { subtotal, discountAmount: discAmount, grandTotal };
  }, [items, discount, discountType]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (items.length === 0) e.items = "Add at least 1 item";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: QuotationInput = {
      date,
      expiryDate: expiryDate || null,
      customerId: customerId || null,
      warehouseId: warehouseId || null,
      subtotal: totals.subtotal,
      discount,
      discountType,
      discountAmount: totals.discountAmount,
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
          <h2 className="card-title text-lg mb-2">Quotation Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <FormField label="Date" required>
              <input type="date" className="input input-bordered w-full" value={date}
                onChange={(e) => setDate(e.target.value)} disabled={loading} />
            </FormField>
            <FormField label="Expiry Date">
              <input type="date" className="input input-bordered w-full" value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)} disabled={loading} />
            </FormField>
            <FormField label="Customer">
              <select className="select select-bordered w-full" value={customerId}
                onChange={(e) => setCustomerId(e.target.value)} disabled={loading}>
                <option value="">— Select —</option>
                {customersData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Warehouse">
              <select className="select select-bordered w-full" value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)} disabled={loading}>
                <option value="">— None —</option>
                {warehousesData?.data?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status" required>
              <select className="select select-bordered w-full" value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)} disabled={loading}>
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
                    <th className="text-right">Price</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Discount</th>
                    <th className="text-right">Tax %</th>
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
                          value={it.unitPrice}
                          onChange={(e) => updateItem(it._localId, { unitPrice: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td>
                        <input type="number" min="1" step="1"
                          className="input input-bordered input-sm w-20 text-right"
                          value={it.quantity}
                          onChange={(e) => updateItem(it._localId, { quantity: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01"
                          className="input input-bordered input-sm w-20 text-right"
                          value={it.discount}
                          onChange={(e) => updateItem(it._localId, { discount: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01"
                          className="input input-bordered input-sm w-20 text-right"
                          value={it.taxRate}
                          onChange={(e) => updateItem(it._localId, { taxRate: parseFloat(e.target.value) || 0 })} />
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
            <h2 className="card-title text-lg mb-2">Adjustments</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Discount">
                <input type="number" min="0" step="0.01" className="input input-bordered w-full"
                  value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} disabled={loading} />
              </FormField>
              <FormField label="Discount Type">
                <select className="select select-bordered w-full" value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)} disabled={loading}>
                  <option value="FIXED">Fixed</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </FormField>
            </div>
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
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="font-mono text-error">-{totals.discountAmount.toFixed(2)}</span></div>
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
          {quotation ? "Update Quotation" : "Create Quotation"}
        </button>
      </div>
    </form>
  );
}
