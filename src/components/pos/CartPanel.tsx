"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeItem,
  updateQuantity,
  updateItemDiscount,
  setDiscount,
  setNote,
  clearCart,
  holdOrder,
} from "@/store/slices/cartSlice";

interface Props {
  onPay: () => void;
  onRecallClick: () => void;
}

export function CartPanel({ onPay, onRecallClick }: Props) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart);

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

  return (
    <div className="flex flex-col h-full bg-base-100 border-l border-base-300">
      <div className="p-3 border-b border-base-300 flex justify-between items-center">
        <h2 className="font-bold text-lg">Cart ({cart.items.length})</h2>
        <div className="flex gap-1">
          <button onClick={onRecallClick} className="btn btn-xs btn-ghost" title="Held orders">
            🗂 {cart.heldOrders.length}
          </button>
          <button
            onClick={() => dispatch(holdOrder())}
            disabled={cart.items.length === 0}
            className="btn btn-xs btn-warning"
          >
            Hold
          </button>
          <button
            onClick={() => dispatch(clearCart())}
            disabled={cart.items.length === 0}
            className="btn btn-xs btn-ghost text-error"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto p-2">
        {cart.items.length === 0 ? (
          <div className="text-center text-base-content/50 py-10 text-sm">
            Cart empty. Scan or click product.
          </div>
        ) : (
          <div className="space-y-2">
            {cart.items.map((it) => {
              const lineGross = it.unitPrice * it.quantity;
              const disc = it.discountType === "PERCENTAGE" ? (lineGross * it.discount) / 100 : it.discount;
              const lineNet = Math.max(0, lineGross - disc);
              const tax = (lineNet * it.taxRate) / 100;
              const lineTotal = lineNet + tax;
              return (
                <div key={`${it.productId}-${it.variantName || ""}`} className="card bg-base-200 p-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{it.productName}</div>
                      <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                    </div>
                    <button
                      onClick={() => dispatch(removeItem({ productId: it.productId, variantName: it.variantName }))}
                      className="btn btn-xs btn-ghost text-error"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => dispatch(updateQuantity({
                          productId: it.productId,
                          variantName: it.variantName,
                          quantity: Math.max(0.001, it.quantity - 1),
                        }))}
                        className="btn btn-xs btn-circle"
                      >−</button>
                      <input
                        type="number"
                        min="0.001"
                        step="1"
                        className="input input-xs w-14 text-center"
                        value={it.quantity}
                        onChange={(e) => dispatch(updateQuantity({
                          productId: it.productId,
                          variantName: it.variantName,
                          quantity: parseFloat(e.target.value) || 1,
                        }))}
                      />
                      <button
                        onClick={() => dispatch(updateQuantity({
                          productId: it.productId,
                          variantName: it.variantName,
                          quantity: it.quantity + 1,
                        }))}
                        className="btn btn-xs btn-circle"
                      >+</button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-60">৳{it.unitPrice.toFixed(2)} × {it.quantity}</div>
                      <div className="font-bold font-mono">৳{lineTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  {disc > 0 && (
                    <div className="text-xs text-error mt-1">Discount: -৳{disc.toFixed(2)}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-base-300 p-3 space-y-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">৳{subtotal.toFixed(2)}</span></div>
        {orderTaxAmount > 0 && (
          <div className="flex justify-between"><span>Tax</span><span className="font-mono">৳{orderTaxAmount.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between items-center">
          <span>Discount</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input input-xs w-20 text-right"
              value={cart.discount}
              onChange={(e) => dispatch(setDiscount({
                discount: parseFloat(e.target.value) || 0,
                discountType: cart.discountType,
              }))}
            />
            <select
              className="select select-xs"
              value={cart.discountType}
              onChange={(e) => dispatch(setDiscount({
                discount: cart.discount,
                discountType: e.target.value as "FIXED" | "PERCENTAGE",
              }))}
            >
              <option value="FIXED">৳</option>
              <option value="PERCENTAGE">%</option>
            </select>
          </div>
        </div>
        <input
          type="text"
          placeholder="Note..."
          className="input input-bordered input-sm w-full"
          value={cart.note}
          onChange={(e) => dispatch(setNote(e.target.value))}
        />
        <div className="divider my-1" />
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span className="font-mono text-primary">৳{grandTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={onPay}
          disabled={cart.items.length === 0}
          className="btn btn-primary btn-block btn-lg mt-2"
        >
          PAY (Ctrl+Enter)
        </button>
      </div>
    </div>
  );
}
