"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { TaxRate, TaxRateInput } from "@/store/api/taxRatesApi";
import toast from "react-hot-toast";

interface TaxRateModalProps {
  open: boolean;
  taxRate?: TaxRate | null;
  onClose: () => void;
  onSubmit: (data: TaxRateInput) => Promise<void>;
  loading?: boolean;
}

export function TaxRateModal({
  open,
  taxRate,
  onClose,
  onSubmit,
  loading = false,
}: TaxRateModalProps) {
  const [formData, setFormData] = useState<TaxRateInput>({
    name: "",
    rate: 0,
    type: "PERCENTAGE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taxRate) {
      setFormData({
        name: taxRate.name,
        rate: taxRate.rate,
        type: taxRate.type,
      });
    } else {
      setFormData({
        name: "",
        rate: 0,
        type: "PERCENTAGE",
      });
    }
    setErrors({});
  }, [taxRate, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tax rate name is required";
    }
    if (formData.rate < 0 || formData.rate > 100) {
      newErrors.rate = "Rate must be between 0 and 100";
    }

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
      toast.error(err.message || "Failed to save tax rate");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={taxRate ? "Edit Tax Rate" : "Add Tax Rate"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm"></span>}
            {taxRate ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormField label="Tax Rate Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., VAT 15%, Import Duty"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Rate" error={errors.rate} required>
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
              value={formData.rate}
              onChange={(e) =>
                setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
              }
              disabled={loading}
            />
          </FormField>

          <FormField label="Type" required>
            <select
              className="select select-bordered w-full"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "PERCENTAGE" | "FIXED",
                })
              }
              disabled={loading}
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
