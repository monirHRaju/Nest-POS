"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { PaymentInput, PaymentMethod } from "@/store/api/paymentsApi";
import { format } from "date-fns";

interface Props {
  open: boolean;
  due: number;
  parent: { saleId?: string; purchaseId?: string; returnId?: string };
  onClose: () => void;
  onSubmit: (data: PaymentInput) => Promise<void>;
  loading?: boolean;
}

const METHODS: PaymentMethod[] = ["CASH", "CARD", "CHEQUE", "BANK_TRANSFER", "GIFT_CARD", "MOBILE_PAYMENT", "OTHER"];

export function PaymentModal({ open, due, parent, onClose, onSubmit, loading = false }: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [bankName, setBankName] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setAmount(due);
      setDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod("CASH");
      setTransactionRef("");
      setBankName("");
      setChequeNumber("");
      setNote("");
      setErrors({});
    }
  }, [open, due]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (amount <= 0) e.amount = "Must be > 0";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    await onSubmit({
      ...parent,
      date,
      amount,
      paymentMethod,
      transactionRef: transactionRef || null,
      bankName: bankName || null,
      chequeNumber: chequeNumber || null,
      note: note || null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Payment"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            Save Payment
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="alert alert-info text-sm">
          <span>Due: <span className="font-bold font-mono">৳{due.toFixed(2)}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" error={errors.amount} required>
            <input type="number" min="0" step="0.01" className="input input-bordered w-full"
              value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} disabled={loading} />
          </FormField>
          <FormField label="Date" required>
            <input type="date" className="input input-bordered w-full"
              value={date} onChange={(e) => setDate(e.target.value)} disabled={loading} />
          </FormField>
        </div>
        <FormField label="Payment Method" required>
          <select className="select select-bordered w-full" value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} disabled={loading}>
            {METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
          </select>
        </FormField>
        {(paymentMethod === "BANK_TRANSFER" || paymentMethod === "CHEQUE") && (
          <FormField label="Bank Name">
            <input className="input input-bordered w-full" value={bankName}
              onChange={(e) => setBankName(e.target.value)} disabled={loading} />
          </FormField>
        )}
        {paymentMethod === "CHEQUE" && (
          <FormField label="Cheque Number">
            <input className="input input-bordered w-full" value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value)} disabled={loading} />
          </FormField>
        )}
        {(paymentMethod === "CARD" || paymentMethod === "BANK_TRANSFER" || paymentMethod === "MOBILE_PAYMENT") && (
          <FormField label="Transaction Reference">
            <input className="input input-bordered w-full" value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)} disabled={loading} />
          </FormField>
        )}
        <FormField label="Note">
          <textarea className="textarea textarea-bordered w-full" rows={2}
            value={note} onChange={(e) => setNote(e.target.value)} disabled={loading} />
        </FormField>
      </div>
    </Modal>
  );
}
