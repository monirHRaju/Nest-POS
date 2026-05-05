"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetSaleQuery } from "@/store/api/salesApi";
import { useCreatePaymentMutation, useDeletePaymentMutation } from "@/store/api/paymentsApi";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Receipt } from "@/components/pos/Receipt";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  COMPLETED: "badge-success",
  CANCELED: "badge-error",
};

const paymentColor: Record<string, string> = {
  UNPAID: "badge-error",
  PARTIAL: "badge-warning",
  PAID: "badge-success",
};

export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: sale, isLoading, refetch } = useGetSaleQuery(params.id);
  const [createPayment, { isLoading: isPaying }] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [deletePayId, setDeletePayId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  }
  if (!sale) return <div>Not found</div>;

  const grandTotal = Number(sale.grandTotal);
  const paidAmount = Number(sale.paidAmount);
  const due = Math.max(0, grandTotal - paidAmount);

  return (
    <>
      <div className="flex items-center justify-between mb-6 receipt-controls">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
          <h1 className="text-2xl font-bold">Sale {sale.referenceNo}</h1>
          <span className={`badge ${statusColor[sale.status]}`}>{sale.status}</span>
          <span className={`badge ${paymentColor[sale.paymentStatus]}`}>{sale.paymentStatus}</span>
          <span className="badge badge-outline">{sale.source}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReceipt(true)} className="btn btn-outline btn-sm">🖨 Receipt</button>
          {due > 0 && sale.status === "COMPLETED" && (
            <button onClick={() => setShowPayment(true)} className="btn btn-primary btn-sm">💰 Add Payment</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 receipt-controls">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/60">Date:</span> {format(new Date(sale.date), "dd-MM-yyyy HH:mm")}</div>
                <div><span className="text-base-content/60">Customer:</span> {sale.customer?.name || "—"}</div>
                <div><span className="text-base-content/60">Warehouse:</span> {sale.warehouse?.name || "—"}</div>
                <div><span className="text-base-content/60">Cashier:</span> {sale.user?.firstName} {sale.user?.lastName}</div>
              </div>
              {sale.note && <div className="mt-3 text-sm"><span className="text-base-content/60">Note:</span> {sale.note}</div>}
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
                      <th className="text-right">Price</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Tax</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div>{it.productName}</div>
                          <div className="text-xs text-base-content/60 font-mono">{it.productCode}</div>
                        </td>
                        <td className="text-right font-mono">{Number(it.unitPrice).toFixed(2)}</td>
                        <td className="text-right">{Number(it.quantity)}</td>
                        <td className="text-right font-mono">{Number(it.discount).toFixed(2)}</td>
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
              {sale.payments && sale.payments.length > 0 ? (
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
                      {sale.payments.map((p: any) => (
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
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">৳{Number(sale.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Order Tax</span><span className="font-mono">৳{Number(sale.orderTaxAmount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="font-mono text-error">-৳{Number(sale.discountAmount).toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span className="font-mono">৳{grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Paid</span><span className="font-mono text-success">৳{paidAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Due</span><span className="font-mono text-warning">৳{due.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt overlay */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-4 max-w-sm w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3 receipt-controls">
              <h3 className="font-bold">Receipt</h3>
              <button onClick={() => setShowReceipt(false)} className="btn btn-sm btn-ghost">✕</button>
            </div>
            <Receipt sale={sale} />
            <div className="flex gap-2 mt-4 receipt-controls">
              <button onClick={() => window.print()} className="btn btn-primary flex-1">🖨 Print</button>
              <button onClick={() => setShowReceipt(false)} className="btn btn-outline flex-1">Close</button>
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        open={showPayment}
        due={due}
        parent={{ saleId: params.id }}
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
