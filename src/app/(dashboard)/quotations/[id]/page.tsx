"use client";

import { useRouter, useParams } from "next/navigation";
import { useGetQuotationQuery, useConvertQuotationMutation } from "@/store/api/quotationsApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  SENT: "badge-info",
  ACCEPTED: "badge-success",
  REJECTED: "badge-error",
  CONVERTED: "badge-primary",
  EXPIRED: "badge-warning",
};

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: quotation, isLoading } = useGetQuotationQuery(params.id);
  const [convertQuotation, { isLoading: isConverting }] = useConvertQuotationMutation();

  if (isLoading) return <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>;
  if (!quotation) return <div>Not found</div>;

  const handleConvert = async () => {
    if (!confirm("Create a sale from this quotation? Stock will decrease.")) return;
    try {
      const res = await convertQuotation(params.id).unwrap();
      toast.success("Converted");
      router.push(`/sales/${res.saleId}`);
    } catch (e: any) { toast.error(e.data?.error || "Error"); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Back</button>
          <h1 className="text-2xl font-bold">Quotation {quotation.referenceNo}</h1>
          <span className={`badge ${statusColor[quotation.status]}`}>{quotation.status}</span>
        </div>
        <div className="flex gap-2">
          {quotation.status !== "CONVERTED" && (
            <>
              <button onClick={() => router.push(`/quotations/edit/${params.id}`)} className="btn btn-outline btn-sm">✎ Edit</button>
              <button onClick={handleConvert} disabled={isConverting} className="btn btn-success btn-sm">→ Convert to Sale</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-lg">Info</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-base-content/60">Date:</span> {format(new Date(quotation.date), "dd-MM-yyyy")}</div>
                <div><span className="text-base-content/60">Expiry:</span> {quotation.expiryDate ? format(new Date(quotation.expiryDate), "dd-MM-yyyy") : "—"}</div>
                <div><span className="text-base-content/60">Customer:</span> {quotation.customer?.name || "—"}</div>
                <div><span className="text-base-content/60">Items:</span> {quotation.items?.length || 0}</div>
              </div>
              {quotation.note && <div className="mt-3 text-sm"><span className="text-base-content/60">Note:</span> {quotation.note}</div>}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
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
                    {quotation.items?.map((it) => (
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
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
          <div className="card-body">
            <h2 className="card-title text-lg">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">৳{Number(quotation.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="font-mono text-error">-৳{Number(quotation.discountAmount).toFixed(2)}</span></div>
              <div className="divider my-1" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="font-mono text-primary">৳{Number(quotation.grandTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
