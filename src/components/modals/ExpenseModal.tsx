"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Expense, ExpenseInput } from "@/store/api/expensesApi";
import { useGetExpenseCategoriesQuery } from "@/store/api/expenseCategoriesApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";
import { format } from "date-fns";

interface Props {
  open: boolean;
  item?: Expense | null;
  onClose: () => void;
  onSubmit: (data: ExpenseInput) => Promise<void>;
  loading?: boolean;
}

export function ExpenseModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);
  const [warehouseId, setWarehouseId] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: catData } = useGetExpenseCategoriesQuery({ pageSize: 100 });
  const { data: whData } = useGetWarehousesQuery({ pageSize: 100 });

  useEffect(() => {
    if (item) {
      setDate(format(new Date(item.date), "yyyy-MM-dd"));
      setCategoryId(item.categoryId);
      setAmount(Number(item.amount));
      setWarehouseId(item.warehouseId || "");
      setNote(item.note || "");
    } else {
      setDate(format(new Date(), "yyyy-MM-dd"));
      setCategoryId("");
      setAmount(0);
      setWarehouseId("");
      setNote("");
    }
    setErrors({});
  }, [item, open]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!categoryId) e.categoryId = "Required";
    if (amount <= 0) e.amount = "Must be > 0";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    await onSubmit({
      date,
      categoryId,
      amount,
      warehouseId: warehouseId || null,
      note: note || null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Expense" : "Add Expense"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            {item ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" required>
            <input type="date" className="input input-bordered w-full" value={date}
              onChange={(e) => setDate(e.target.value)} disabled={loading} />
          </FormField>
          <FormField label="Amount" error={errors.amount} required>
            <input type="number" min="0" step="0.01" className="input input-bordered w-full" value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} disabled={loading} />
          </FormField>
        </div>
        <FormField label="Category" error={errors.categoryId} required>
          <select className="select select-bordered w-full" value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)} disabled={loading}>
            <option value="">— Select —</option>
            {catData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Warehouse">
          <select className="select select-bordered w-full" value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)} disabled={loading}>
            <option value="">— None —</option>
            {whData?.data?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </FormField>
        <FormField label="Note">
          <textarea className="textarea textarea-bordered w-full" rows={3} value={note}
            onChange={(e) => setNote(e.target.value)} disabled={loading} />
        </FormField>
      </div>
    </Modal>
  );
}
