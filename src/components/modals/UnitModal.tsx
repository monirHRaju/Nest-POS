"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Unit, UnitInput } from "@/store/api/unitsApi";
import toast from "react-hot-toast";

interface UnitModalProps {
  open: boolean;
  unit?: Unit | null;
  onClose: () => void;
  onSubmit: (data: UnitInput) => Promise<void>;
  loading?: boolean;
}

export function UnitModal({
  open,
  unit,
  onClose,
  onSubmit,
  loading = false,
}: UnitModalProps) {
  const [formData, setFormData] = useState<UnitInput>({
    name: "",
    shortName: "",
    baseUnit: null,
    operator: null,
    operationValue: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name,
        shortName: unit.shortName,
        baseUnit: unit.baseUnit,
        operator: unit.operator,
        operationValue: unit.operationValue,
      });
    } else {
      setFormData({
        name: "",
        shortName: "",
        baseUnit: null,
        operator: null,
        operationValue: null,
      });
    }
    setErrors({});
  }, [unit, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Unit name is required";
    }
    if (!formData.shortName.trim()) {
      newErrors.shortName = "Short name is required";
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
      toast.error(err.message || "Failed to save unit");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={unit ? "Edit Unit" : "Add Unit"}
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
            {unit ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormField label="Unit Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Piece, Kilogram"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <FormField label="Short Name" error={errors.shortName} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., pc, kg"
            value={formData.shortName}
            onChange={(e) =>
              setFormData({ ...formData, shortName: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <div className="divider my-2">Conversion (Optional)</div>

        <FormField label="Base Unit" helperText="Name of the unit to convert from">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Piece"
            value={formData.baseUnit || ""}
            onChange={(e) =>
              setFormData({ ...formData, baseUnit: e.target.value || null })
            }
            disabled={loading}
          />
        </FormField>

        <FormField label="Operator">
          <select
            className="select select-bordered w-full"
            value={formData.operator || ""}
            onChange={(e) =>
              setFormData({ ...formData, operator: (e.target.value as "*" | "/" | null) || null })
            }
            disabled={loading}
          >
            <option value="">Select operator</option>
            <option value="*">× Multiply</option>
            <option value="/">÷ Divide</option>
          </select>
        </FormField>

        <FormField label="Operation Value" helperText="e.g., 1 kg = 1000 × grams">
          <input
            type="number"
            className="input input-bordered w-full"
            placeholder="e.g., 1000"
            step="0.0001"
            value={formData.operationValue || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                operationValue: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
}
