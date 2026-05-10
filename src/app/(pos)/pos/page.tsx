"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem,
  setCustomer,
  setWarehouse,
  setOrderTax,
  clearCart,
} from "@/store/slices/cartSlice";
import { useGetCustomersQuery } from "@/store/api/customersApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import { useGetTaxRatesQuery } from "@/store/api/taxRatesApi";
import { useGetProductsQuery, Product } from "@/store/api/productsApi";
import { useCreateSaleMutation, SaleInput, SalePaymentInput, Sale } from "@/store/api/salesApi";
import { useCurrentSession } from "@/lib/hooks/useSession";
import { useBarcodeScanner } from "@/lib/hooks/useBarcodeScanner";
import { useCustomerDisplaySync } from "@/lib/hooks/useCustomerDisplaySync";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { POSPaymentModal } from "@/components/pos/POSPaymentModal";
import { HeldOrdersModal } from "@/components/pos/HeldOrdersModal";
import { Receipt } from "@/components/pos/Receipt";
import { useGetPrintersQuery } from "@/store/api/printersApi";
import { buildReceipt, printOnce } from "@/lib/hardware/escpos";
import toast from "react-hot-toast";

export default function POSPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart);
  const { user } = useCurrentSession();

  const [showPayment, setShowPayment] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const { data: customersData } = useGetCustomersQuery({ pageSize: 200 });
  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 100 });
  const { data: taxesData } = useGetTaxRatesQuery({ pageSize: 100 });
  const { data: printersData } = useGetPrintersQuery({ pageSize: 50 });
  const [createSale, { isLoading: isCreating }] = useCreateSaleMutation();

  // Init defaults
  useEffect(() => {
    if (!cart.warehouseId && warehousesData?.data) {
      const def =
        (user?.warehouseId && warehousesData.data.find((w: any) => w.id === user.warehouseId)) ||
        warehousesData.data.find((w: any) => w.isDefault) ||
        warehousesData.data[0];
      if (def) dispatch(setWarehouse(def.id));
    }
  }, [warehousesData, cart.warehouseId, user, dispatch]);

  useEffect(() => {
    if (!cart.customerId && customersData?.data) {
      const walkIn = customersData.data.find((c: any) => c.isWalkIn);
      if (walkIn) dispatch(setCustomer(walkIn.id));
    }
  }, [customersData, cart.customerId, dispatch]);

  // Sync cart to customer display
  const customerName = useMemo(
    () => customersData?.data?.find((c: any) => c.id === cart.customerId)?.name ?? null,
    [customersData, cart.customerId]
  );

  // Cart totals (mirror CartPanel)
  const totals = useMemo(() => {
    const subtotal = cart.items.reduce((sum, it) => {
      const lineGross = it.unitPrice * it.quantity;
      const disc = it.discountType === "PERCENTAGE" ? (lineGross * it.discount) / 100 : it.discount;
      const lineNet = Math.max(0, lineGross - disc);
      const tax = (lineNet * it.taxRate) / 100;
      return sum + lineNet + tax;
    }, 0);
    const orderTaxAmount = cart.orderTaxRate > 0 ? (subtotal * cart.orderTaxRate) / 100 : 0;
    const discountAmount =
      cart.discountType === "PERCENTAGE"
        ? ((subtotal + orderTaxAmount) * cart.discount) / 100
        : cart.discount;
    const grandTotal = Math.max(0, subtotal + orderTaxAmount - discountAmount);
    return { subtotal, orderTaxAmount, discountAmount, grandTotal };
  }, [cart]);

  const displayPayload = useMemo(() => ({
    items: cart.items.map((it) => {
      const lineGross = it.unitPrice * it.quantity;
      const disc = it.discountType === "PERCENTAGE" ? (lineGross * it.discount) / 100 : it.discount;
      const lineNet = Math.max(0, lineGross - disc);
      const tax = (lineNet * it.taxRate) / 100;
      return {
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        lineTotal: lineNet + tax,
      };
    }),
    subtotal: totals.subtotal,
    tax: totals.orderTaxAmount,
    discount: totals.discountAmount,
    grandTotal: totals.grandTotal,
    customerName,
    storeName: "Nest POS",
    currencySymbol: "৳",
    updatedAt: Date.now(),
  }), [cart, totals, customerName]);

  useCustomerDisplaySync(displayPayload);

  // Barcode lookup — find product by code, add to cart
  const { refetch: refetchProducts } = useGetProductsQuery({ pageSize: 1 });

  const handleBarcodeScan = useCallback(
    async (code: string) => {
      try {
        const res = await fetch(`/api/v1/products?search=${encodeURIComponent(code)}&pageSize=5`);
        const data = await res.json();
        const exact = data.data?.find((p: any) => p.code === code) || data.data?.[0];
        if (!exact) {
          toast.error(`No product for "${code}"`);
          return;
        }
        addProductToCart(exact);
        // Audio feedback
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.frequency.value = 800;
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        } catch {}
      } catch {
        toast.error("Scan lookup failed");
      }
    },
    []
  );

  useBarcodeScanner(handleBarcodeScan, { enabled: !showPayment && !showHeld });

  const addProductToCart = (p: Product) => {
    if (!p.isActive) {
      toast.error("Product inactive");
      return;
    }
    const stock = p.totalStock ?? 0;
    if (stock <= 0) {
      toast.error(`${p.name} — out of stock`);
      return;
    }
    dispatch(addItem({
      productId: p.id,
      productName: p.name,
      productCode: p.code,
      unitPrice: Number(p.sellingPrice),
      quantity: 1,
      discount: 0,
      discountType: "FIXED",
      taxRate: Number(p.tax?.rate) || 0,
      image: p.image || null,
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "Enter" && cart.items.length > 0) {
        e.preventDefault();
        setShowPayment(true);
      }
      if (e.key === "Escape") {
        setShowPayment(false);
        setShowHeld(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.items.length]);

  const handlePay = async (payments: SalePaymentInput[]) => {
    if (!cart.warehouseId) {
      toast.error("Select warehouse");
      return;
    }
    const items = cart.items.map((it) => {
      const lineGross = it.unitPrice * it.quantity;
      const disc = it.discountType === "PERCENTAGE" ? (lineGross * it.discount) / 100 : it.discount;
      const lineNet = Math.max(0, lineGross - disc);
      const taxAmount = (lineNet * it.taxRate) / 100;
      return {
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode,
        variantName: it.variantName || null,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        discount: it.discount,
        discountType: it.discountType,
        taxRate: it.taxRate,
        taxAmount,
        subtotal: lineNet + taxAmount,
      };
    });

    const orderTax = taxesData?.data?.find((t: any) => t.id === cart.orderTaxId);
    const orderTaxId = orderTax?.id || null;

    const payload: SaleInput = {
      customerId: cart.customerId,
      warehouseId: cart.warehouseId,
      items,
      payments,
      subtotal: totals.subtotal,
      orderTaxId,
      orderTaxAmount: totals.orderTaxAmount,
      discount: cart.discount,
      discountType: cart.discountType,
      discountAmount: totals.discountAmount,
      grandTotal: totals.grandTotal,
      status: "COMPLETED",
      source: "POS",
      note: cart.note || null,
    };

    try {
      const sale = await createSale(payload).unwrap();
      toast.success("Sale completed");
      setLastSale(sale);
      setShowPayment(false);
      setShowReceipt(true);
      dispatch(clearCart());
      refetchProducts();
    } catch (e: any) {
      toast.error(e.data?.error || "Sale failed");
    }
  };

  const printReceipt = () => {
    setTimeout(() => window.print(), 100);
  };

  const printThermalReceipt = async () => {
    if (!lastSale) return;
    const defaultPrinter = printersData?.data?.find((p) => p.isDefault && p.isActive)
      ?? printersData?.data?.find((p) => p.type === "RECEIPT" && p.isActive);
    if (!defaultPrinter) {
      toast.error("No active receipt printer configured. Add one in Settings → Printers.");
      return;
    }
    if (defaultPrinter.connectionType !== "BROWSER" && defaultPrinter.connectionType !== "USB") {
      toast.error(`Thermal print requires BROWSER/USB printer. Configured: ${defaultPrinter.connectionType}`);
      return;
    }
    try {
      const buf = buildReceipt({
        storeName: "Nest POS",
        referenceNo: lastSale.referenceNo,
        date: new Date(lastSale.createdAt).toLocaleString(),
        cashier: user ? `${user.firstName} ${user.lastName}` : undefined,
        customer: lastSale.customer?.name ?? "Walk-in",
        items: (lastSale.items ?? []).map((it: any) => ({
          name: it.productName,
          qty: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          subtotal: Number(it.subtotal),
        })),
        subtotal: Number(lastSale.subtotal),
        tax: Number(lastSale.orderTaxAmount ?? 0),
        discount: Number(lastSale.discountAmount ?? 0),
        grandTotal: Number(lastSale.grandTotal),
        paid: Number(lastSale.paidAmount ?? 0),
        currencySymbol: "৳",
        footer: "Thank you!",
      }, defaultPrinter.characterWidth);
      await printOnce(buf);
      toast.success("Receipt sent to printer");
    } catch (err: any) {
      toast.error(err.message || "Print failed");
    }
  };

  const openCustomerDisplay = () => {
    window.open("/customer-display", "customer-display", "width=1024,height=768,popup=yes");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-base-100 border-b border-base-300 p-2 flex items-center gap-2 flex-wrap">
        <button onClick={() => router.push("/")} className="btn btn-sm btn-ghost">← Dashboard</button>
        <span className="font-bold text-lg ml-2">POS</span>

        <select
          className="select select-sm select-bordered"
          value={cart.warehouseId || ""}
          onChange={(e) => dispatch(setWarehouse(e.target.value || null))}
        >
          <option value="">Select Warehouse</option>
          {warehousesData?.data?.map((w: any) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select
          className="select select-sm select-bordered min-w-48"
          value={cart.customerId || ""}
          onChange={(e) => dispatch(setCustomer(e.target.value || null))}
        >
          <option value="">Select Customer</option>
          {customersData?.data?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="select select-sm select-bordered"
          value={cart.orderTaxId || ""}
          onChange={(e) => {
            const t = taxesData?.data?.find((x: any) => x.id === e.target.value);
            dispatch(setOrderTax({ taxId: e.target.value || null, taxRate: t ? Number(t.rate) : 0 }));
          }}
        >
          <option value="">No Order Tax</option>
          {taxesData?.data?.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
          ))}
        </select>

        <button onClick={openCustomerDisplay} className="btn btn-sm btn-outline ml-auto">
          🖥 Display
        </button>

        <div className="text-sm text-base-content/60">
          {user?.firstName} • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] overflow-hidden">
        <ProductGrid onSelect={addProductToCart} warehouseId={cart.warehouseId} />
        <CartPanel onPay={() => setShowPayment(true)} onRecallClick={() => setShowHeld(true)} />
      </div>

      <POSPaymentModal
        open={showPayment}
        grandTotal={totals.grandTotal}
        onClose={() => setShowPayment(false)}
        onConfirm={handlePay}
        loading={isCreating}
      />

      <HeldOrdersModal open={showHeld} onClose={() => setShowHeld(false)} />

      {/* Receipt overlay */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-4 max-w-sm w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3 receipt-controls">
              <h3 className="font-bold">Receipt — {lastSale.referenceNo}</h3>
              <button onClick={() => setShowReceipt(false)} className="btn btn-sm btn-ghost">✕</button>
            </div>
            <Receipt sale={lastSale} />
            <div className="flex gap-2 mt-4 receipt-controls">
              <button onClick={printThermalReceipt} className="btn btn-primary flex-1">🖨 Thermal</button>
              <button onClick={printReceipt} className="btn btn-outline flex-1">Browser Print</button>
              <button onClick={() => setShowReceipt(false)} className="btn btn-ghost">New Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
