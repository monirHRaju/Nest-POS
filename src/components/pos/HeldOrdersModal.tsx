"use client";

import { Modal } from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { recallOrder, removeHeldOrder } from "@/store/slices/cartSlice";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HeldOrdersModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const heldOrders = useAppSelector((s) => s.cart.heldOrders);

  return (
    <Modal open={open} onClose={onClose} title="Held Orders" size="lg">
      {heldOrders.length === 0 ? (
        <div className="text-center text-base-content/50 py-10">No held orders</div>
      ) : (
        <div className="space-y-2">
          {heldOrders.map((o) => {
            const total = o.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
            return (
              <div key={o.id} className="card bg-base-200 p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-mono opacity-60">{format(new Date(o.createdAt), "dd-MM HH:mm")}</div>
                    <div className="font-medium">{o.items.length} item(s) — ৳{total.toFixed(2)}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {o.items.slice(0, 3).map((it) => it.productName).join(", ")}
                      {o.items.length > 3 && ` +${o.items.length - 3} more`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { dispatch(recallOrder(o.id)); onClose(); }}
                      className="btn btn-sm btn-primary"
                    >
                      Recall
                    </button>
                    <button
                      onClick={() => dispatch(removeHeldOrder(o.id))}
                      className="btn btn-sm btn-ghost text-error"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
