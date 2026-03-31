"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Currency, CurrencyInput } from "@/store/api/currenciesApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: Currency | null;
  onClose: () => void;
  onSubmit: (data: CurrencyInput) => Promise<void>;
  loading?: boolean;
}

export function CurrencyModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<CurrencyInput>({
    name: "",
    code: "",
    symbol: "",
    exchangeRate: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code,
        symbol: item.symbol,
        exchangeRate: item.exchangeRate,
      });
    } else {
      setFormData({ name: "", code: "", symbol: "", exchangeRate: 1 });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.code.trim()) newErrors.code = "Code is required";
    if (formData.code.length !== 3) newErrors.code = "Code must be 3 characters (e.g., USD)";
    if (!formData.symbol.trim()) newErrors.symbol = "Symbol is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Currency" : "Add Currency"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm"></span>}
            {item ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormField label="Currency Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., US Dollar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </FormField>
        <FormField label="Code" error={errors.code} required helperText="3-letter ISO code">
          <input
            type="text"
            className="input input-bordered w-full uppercase"
            placeholder="USD"
            maxLength={3}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            disabled={loading}
          />
        </FormField>
        <FormField label="Symbol" error={errors.symbol} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="$"
            maxLength={10}
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            disabled={loading}
          />
        </FormField>
        <FormField label="Exchange Rate" helperText="Relative to base currency">
          <input
            type="number"
            className="input input-bordered w-full"
            placeholder="1.0"
            step="0.0001"
            value={formData.exchangeRate}
            onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
}
