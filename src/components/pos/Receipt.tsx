"use client";

import { format } from "date-fns";
import { Sale } from "@/store/api/salesApi";

interface Props {
  sale: Sale;
  tenantName?: string;
  receiptHeader?: string;
  receiptFooter?: string;
}

export function Receipt({ sale, tenantName = "Nest-POS", receiptHeader, receiptFooter }: Props) {
  const grandTotal = Number(sale.grandTotal);
  const paidAmount = Number(sale.paidAmount);
  const change = Math.max(0, paidAmount - grandTotal);

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body * { visibility: hidden; }
          .receipt-print, .receipt-print * { visibility: visible; }
          .receipt-print { position: absolute; left: 0; top: 0; width: 72mm; }
        }
      `}</style>
      <div className="receipt-print font-mono text-xs leading-tight" style={{ width: "72mm" }}>
        <div className="text-center mb-2">
          <div className="text-sm font-bold">{tenantName}</div>
          {receiptHeader && <div className="whitespace-pre-line">{receiptHeader}</div>}
        </div>

        <div className="border-t border-b border-dashed border-black py-1 my-1 text-center">
          <div>SALE RECEIPT</div>
          <div>{sale.referenceNo}</div>
        </div>

        <div className="space-y-0.5 mb-2">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(new Date(sale.date), "dd-MM-yyyy HH:mm")}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.user?.firstName} {sale.user?.lastName}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customer.name}</span>
            </div>
          )}
        </div>

        <table className="w-full border-t border-b border-dashed border-black my-1">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left">Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((it) => (
              <tr key={it.id}>
                <td className="text-left" colSpan={4}>
                  <div>{it.productName}</div>
                  <div className="flex justify-between">
                    <span>&nbsp;&nbsp;{Number(it.quantity)} × {Number(it.unitPrice).toFixed(2)}</span>
                    <span>{Number(it.subtotal).toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-0.5 mb-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>৳{Number(sale.subtotal).toFixed(2)}</span>
          </div>
          {Number(sale.orderTaxAmount) > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>৳{Number(sale.orderTaxAmount).toFixed(2)}</span>
            </div>
          )}
          {Number(sale.discountAmount) > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-৳{Number(sale.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-dashed border-black pt-1">
            <span>TOTAL:</span>
            <span>৳{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>৳{paidAmount.toFixed(2)}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between font-bold">
              <span>Change:</span>
              <span>৳{change.toFixed(2)}</span>
            </div>
          )}
        </div>

        {sale.payments && sale.payments.length > 0 && (
          <div className="border-t border-dashed border-black pt-1 mb-2">
            {sale.payments.map((p: any) => (
              <div key={p.id} className="flex justify-between">
                <span>{p.paymentMethod.replace("_", " ")}:</span>
                <span>৳{Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {receiptFooter && (
          <div className="border-t border-dashed border-black pt-2 text-center whitespace-pre-line">
            {receiptFooter}
          </div>
        )}

        <div className="text-center mt-2 text-[10px]">
          Thank you for your purchase!
        </div>
      </div>
    </>
  );
}
