"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { SalePaymentInput } from "@/store/api/salesApi";
import { PaymentMethod } from "@/store/api/paymentsApi";

interface Props {
  open: boolean;
  grandTotal: number;
  onClose: () => void;
  onConfirm: (payments: SalePaymentInput[]) => Promise<void>;
  loading?: boolean;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export function POSPaymentModal({ open, grandTotal, onClose, onConfirm, loading = false }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState("");
  const [bankName, setBankName] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");

  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setReceived(grandTotal);
      setTransactionRef("");
      setBankName("");
      setChequeNumber("");
    }
  }, [open, grandTotal]);

  const change = method === "CASH" ? Math.max(0, received - grandTotal) : 0;
  const due = Math.max(0, grandTotal - received);
  const canSubmit = method === "CASH" ? received >= grandTotal : received > 0;

  const handleConfirm = async () => {
    const payments: SalePaymentInput[] = [{
      amount: Math.min(received, grandTotal), // CASH: don't record change as paid
      paymentMethod: method,
      transactionRef: transactionRef || null,
      bankName: bankName || null,
      chequeNumber: chequeNumber || null,
    }];
    await onConfirm(payments);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payment"
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>Cancel (Esc)</button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit || loading}
            className="btn btn-primary"
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            Complete Sale
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="alert alert-info">
          <div className="flex justify-between items-center w-full">
            <span className="text-lg">Total Due</span>
            <span className="text-2xl font-bold font-mono">৳{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="label"><span className="label-text">Payment Method</span></label>
          <div className="grid grid-cols-3 gap-2">
            {(["CASH", "CARD", "MOBILE_PAYMENT", "BANK_TRANSFER", "CHEQUE", "GIFT_CARD"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`btn btn-sm ${method === m ? "btn-primary" : "btn-outline"}`}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <FormField label={method === "CASH" ? "Cash Received" : "Amount"} required>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input input-bordered input-lg w-full text-right font-mono"
            value={received}
            onChange={(e) => setReceived(parseFloat(e.target.value) || 0)}
            disabled={loading}
            autoFocus
          />
        </FormField>

        {method === "CASH" && (
          <div>
            <label className="label"><span className="label-text">Quick</span></label>
            <div className="grid grid-cols-6 gap-1">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setReceived(received + a)}
                  className="btn btn-xs btn-outline"
                >
                  +{a}
                </button>
              ))}
              <button type="button" onClick={() => setReceived(grandTotal)} className="btn btn-xs btn-outline col-span-3">
                Exact
              </button>
              <button type="button" onClick={() => setReceived(0)} className="btn btn-xs btn-ghost col-span-3">
                Clear
              </button>
            </div>
          </div>
        )}

        {(method === "BANK_TRANSFER" || method === "CHEQUE") && (
          <FormField label="Bank Name">
            <input className="input input-bordered w-full" value={bankName}
              onChange={(e) => setBankName(e.target.value)} disabled={loading} />
          </FormField>
        )}
        {method === "CHEQUE" && (
          <FormField label="Cheque Number">
            <input className="input input-bordered w-full" value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value)} disabled={loading} />
          </FormField>
        )}
        {(method === "CARD" || method === "BANK_TRANSFER" || method === "MOBILE_PAYMENT") && (
          <FormField label="Transaction Reference">
            <input className="input input-bordered w-full" value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)} disabled={loading} />
          </FormField>
        )}

        {method === "CASH" && (
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Change</div>
              <div className="stat-value text-success">৳{change.toFixed(2)}</div>
            </div>
            {due > 0 && (
              <div className="stat">
                <div className="stat-title">Short By</div>
                <div className="stat-value text-error">৳{due.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
