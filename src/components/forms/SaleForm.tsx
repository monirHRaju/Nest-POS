"use client";

import { useState, useEffect, useMemo } from "react";
import { FormField } from "@/components/ui/FormField";
import { ProductSearchSelect } from "@/components/ui/ProductSearchSelect";
import { SaleInput, SaleItemInput, SaleStatus } from "@/store/api/salesApi";
import { useGetCustomersQuery } from "@/store/api/customersApi";
import { useGetBillersQuery } from "@/store/api/billersApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import { useGetTaxRatesQuery } from "@/store/api/taxRatesApi";
import { Product } from "@/store/api/productsApi";
import { format } from "date-fns";

interface Props {
  onSubmit: (data: SaleInput) => Promise<void>;
  loading?: boolean;
}

interface LineItem extends SaleItemInput {
  _localId: string;
}

const STATUSES: SaleStatus[] = ["PENDING", "COMPLETED", "CANCELED"];

export function SaleForm({ onSubmit, loading = false }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customerId, setCustomerId] = useState("");
  const [billerId, setBillerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderTaxId, setOrderTaxId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [shippingCost, setShippingCost] = useState(0);
  const [status, setStatus] = useState<SaleStatus>("COMPLETED");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customersData } = useGetCustomersQuery({ pageSize: 200 });
  const { data: billersData } = useGetBillersQuery({ pageSize: 100 });
  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 100 });
  const { data: taxesData } = useGetTaxRatesQuery({ pageSize: 100 });

  useEffect(() => {
    if (warehousesData?.data && !warehouseId) {
      const def = warehousesData.data.find((w: any) => w.isDefault) || warehousesData.data[0];
      if (def) setWarehouseId(def.id);
    }
    if (customersData?.data && !customerId) {
      const walkIn = customersData.data.find((c: any) => c.isWalkIn);
      if (walkIn) setCustomerId(walkIn.id);
    }
  }, [warehousesData, customersData]);

  const addProduct = (p: Product) => {
    const existing = items.find((it) => it.productId === p.id);
    if (existing) {
      updateItem(existing._localId, { quantity: existing.quantity + 1 });
      return;
    }
    const price = Number(p.sellingPrice) || 0;
    setItems([
      ...items,
      {
        _localId: `new-${Date.now()}-${Math.random()}`,
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        unitPrice: price,
        quantity: 1,
        discount: 0,
        discountType: "FIXED",
        taxRate: Number(p.tax?.rate) || 0,
        taxAmount: 0,
        subtotal: price,
      },
    ]);
  };

  const updateItem = (localId: string, patch: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._localId !== localId) return it;
        const next = { ...it, ...patch };
        const lineGross = next.unitPrice * next.quantity;
        const disc = Number(next.discount) || 0;
        const taxRate = Number(next.taxRate) || 0;
        const discAmount = next.discountType === "PERCENTAGE" ? (lineGross * disc) / 100 : disc;
        const lineNet = Math.max(0, lineGross - discAmount);
        const taxAmount = (lineNet * taxRate) / 100;
        next.taxAmount = taxAmount;
        next.subtotal = lineNet + taxAmount;
        return next;
      })
    );
  };

  const removeItem = (localId: string) => setItems(items.filter((it) => it._localId !== localId));

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
    const orderTax = taxesData?.data?.find((t: any) => t.id === orderTaxId);
    const orderTaxRate = orderTax ? Number(orderTax.rate) : 0;
    const orderTaxAmount = orderTax?.type === "PERCENTAGE" ? (subtotal * orderTaxRate) / 100 : orderTaxRate;
    const discAmount = discountType === "PERCENTAGE" ? ((subtotal + orderTaxAmount) * discount) / 100 : discount;
    const grandTotal = Math.max(0, subtotal + orderTaxAmount - discAmount + shippingCost);
    return { subtotal, orderTaxAmount, discountAmount: discAmount, grandTotal };
  }, [items, orderTaxId, taxesData, discount, discountType, shippingCost]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!warehouseId) e.warehouseId = "Required";
    if (items.length === 0) e.items = "Add at least 1 item";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: SaleInput = {
      date,
      customerId: customerId || null,
      billerId: billerId || null,
      warehouseId,
      orderTaxId: orderTaxId || null,
      orderTaxAmount: totals.orderTaxAmount,
      discount,
      discountType,
      discountAmount: totals.discountAmount,
      shippingCost,
      subtotal: totals.subtotal,
      grandTotal: totals.grandTotal,
      status,
      source: "WEB",
      note: note || null,
      items: items.map(({ _localId, ...rest }) => rest),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title text-lg mb-2">Sale Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <FormField label="Date" required>
              <input type="date" className="input input-bordered w-full"
                value={date} onChange={(e) => setDate(e.target.value)} disabled={loading} />
            </FormField>
            <FormField label="Customer">
              <select className="select select-bordered w-full" value={customerId}
                onChange={(e) => setCustomerId(e.target.value)} disabled={loading}>
                <option value="">— Walk-in —</option>
                {customersData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Biller">
              <select className="select select-bordered w-full" value={billerId}
                onChange={(e) => setBillerId(e.target.value)} disabled={loading}>
                <option value="">— None —</option>
                {billersData?.data?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>
            <FormField label="Warehouse" error={errors.warehouseId} required>
              <select className="select select-bordered w-full" value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)} disabled={loading}>
                <option value="">— Select —</option>
                {warehousesData?.data?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status" required>
              <select className="select select-bordered w-full" value={status}
                onChange={(e) => setStatus(e.target.value as SaleStatus)} disabled={loading}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title text-lg mb-2">Add Products</h2>
          <ProductSearchSelect onSelect={addProduct} disabled={loading} />
          {errors.items && <p className="text-error text-sm mt-2">{errors.items}</p>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Disc</th>
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
                        <input type="number" min="0.001" step="1"
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
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-lg mb-2">Totals</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Order Tax">
                <select className="select select-bordered w-full" value={orderTaxId}
                  onChange={(e) => setOrderTaxId(e.target.value)} disabled={loading}>
                  <option value="">— None —</option>
                  {taxesData?.data?.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.rate}{t.type === "PERCENTAGE" ? "%" : ""})</option>)}
                </select>
              </FormField>
              <FormField label="Shipping">
                <input type="number" min="0" step="0.01" className="input input-bordered w-full"
                  value={shippingCost} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} disabled={loading} />
              </FormField>
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

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-lg mb-2">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Order Tax</span><span className="font-mono">{totals.orderTaxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="font-mono text-error">-{totals.discountAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-mono">{shippingCost.toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span className="font-mono">{totals.grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Create Sale
        </button>
      </div>
    </form>
  );
}
