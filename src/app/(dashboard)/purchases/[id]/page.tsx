"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetPurchaseQuery, useReceivePurchaseMutation } from "@/store/api/purchasesApi";
import { useCreatePaymentMutation, useDeletePaymentMutation } from "@/store/api/paymentsApi";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  ORDERED: "badge-info",
  RECEIVED: "badge-success",
  CANCELED: "badge-error",
};

const paymentColor: Record<string, string> = {
  UNPAID: "badge-error",
  PARTIAL: "badge-warning",
  PAID: "badge-success",
};

export default function PurchaseDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: purchase, isLoading, refetch } = useGetPurchaseQuery(params.id);
  const [receivePurchase, { isLoading: isReceiving }] = useReceivePurchaseMutation();
  const [createPayment, { isLoading: isPaying }] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const [showPayment, setShowPayment] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [deletePayId, setDeletePayId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  }
  if (!purchase) return <div>Not found</div>;

  const grandTotal = Number(purchase.grandTotal);
  const paidAmount = Number(purchase.paidAmount);
  const due = Math.max(0, grandTotal - paidAmount);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
          <h1 className="text-2xl font-bold">Purchase {purchase.referenceNo}</h1>
          <span className={`badge ${statusColor[purchase.status]}`}>{purchase.status}</span>
          <span className={`badge ${paymentColor[purchase.paymentStatus]}`}>{purchase.paymentStatus}</span>
        </div>
        <div className="flex gap-2">
          {purchase.status !== "RECEIVED" && purchase.status !== "CANCELED" && (
            <>
              <button onClick={() => router.push(`/purchases/edit/${params.id}`)} className="btn btn-outline btn-sm">✎ Edit</button>
              <button onClick={() => setShowReceive(true)} className="btn btn-success btn-sm">📦 Receive</button>
            </>
          )}
          {due > 0 && purchase.status !== "CANCELED" && (
            <button onClick={() => setShowPayment(true)} className="btn btn-primary btn-sm">💰 Add Payment</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/60">Date:</span> {format(new Date(purchase.date), "dd-MM-yyyy")}</div>
                <div><span className="text-base-content/60">Supplier:</span> {purchase.supplier?.name || "—"}</div>
                <div><span className="text-base-content/60">Warehouse:</span> {purchase.warehouse?.name || "—"}</div>
                <div><span className="text-base-content/60">Items:</span> {purchase.items?.length || 0}</div>
              </div>
              {purchase.note && (
                <div className="mt-3 text-sm">
                  <span className="text-base-content/60">Note:</span> {purchase.note}
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body p-0">
              <h2 className="card-title text-lg p-4 pb-0">Items</h2>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Cost</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Received</th>
                      <th className="text-right">Tax</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items?.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div>{it.productName}</div>
                          <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                        </td>
                        <td className="text-right font-mono">{Number(it.unitCost).toFixed(2)}</td>
                        <td className="text-right">{Number(it.quantity)}</td>
                        <td className="text-right">{Number(it.receivedQty)}</td>
                        <td className="text-right font-mono">{Number(it.taxAmount).toFixed(2)}</td>
                        <td className="text-right font-mono">{Number(it.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body p-0">
              <h2 className="card-title text-lg p-4 pb-0">Payments</h2>
              {purchase.payments && purchase.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th className="text-right">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="font-mono">{p.referenceNo}</td>
                          <td>{format(new Date(p.date), "dd-MM-yyyy")}</td>
                          <td><span className="badge badge-ghost badge-sm">{p.paymentMethod.replace("_", " ")}</span></td>
                          <td className="text-right font-mono">৳{Number(p.amount).toFixed(2)}</td>
                          <td>
                            <button onClick={() => setDeletePayId(p.id)} className="btn btn-xs btn-ghost text-error">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-sm text-base-content/60">No payments yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow h-fit">
          <div className="card-body">
            <h2 className="card-title text-lg">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">৳{Number(purchase.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Order Tax</span><span className="font-mono">৳{Number(purchase.orderTaxAmount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="font-mono text-error">-৳{Number(purchase.discountAmount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-mono">৳{Number(purchase.shippingCost).toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span className="font-mono">৳{grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Paid</span><span className="font-mono text-success">৳{paidAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Due</span><span className="font-mono text-warning">৳{due.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        due={due}
        parent={{ purchaseId: params.id }}
        onClose={() => setShowPayment(false)}
        onSubmit={async (d) => {
          try {
            await createPayment(d).unwrap();
            toast.success("Payment recorded");
            refetch();
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
        }}
        loading={isPaying}
      />
      <ConfirmDialog
        open={showReceive}
        title="Receive Purchase"
        message="Mark as received? Stock will be increased."
        onConfirm={async () => {
          try {
            await receivePurchase(params.id).unwrap();
            toast.success("Received — stock updated");
            refetch();
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setShowReceive(false);
        }}
        onCancel={() => setShowReceive(false)}
        loading={isReceiving}
      />
      <ConfirmDialog
        open={!!deletePayId}
        title="Delete Payment"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deletePayId) return;
          try {
            await deletePayment(deletePayId).unwrap();
            toast.success("Payment deleted");
            refetch();
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setDeletePayId(null);
        }}
        onCancel={() => setDeletePayId(null)}
        isDangerous
      />
    </>
  );
}
