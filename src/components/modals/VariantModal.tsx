"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Variant, VariantInput } from "@/store/api/variantsApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: Variant | null;
  onClose: () => void;
  onSubmit: (data: VariantInput) => Promise<void>;
  loading?: boolean;
}

export function VariantModal({
  open,
  item,
  onClose,
  onSubmit,
  loading = false,
}: Props) {
  const [formData, setFormData] = useState<VariantInput>({
    name: "",
    values: [],
  });

  const [inputValue, setInputValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        values: [...item.values],
      });
    } else {
      setFormData({
        name: "",
        values: [],
      });
    }
    setInputValue("");
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Variant name is required";
    }
    if (formData.values.length === 0) {
      newErrors.values = "At least one value is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addValue = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (formData.values.includes(trimmed)) {
      toast.error("This value already exists");
      return;
    }

    setFormData({
      ...formData,
      values: [...formData.values, trimmed],
    });
    setInputValue("");
  };

  const removeValue = (index: number) => {
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    } else if (e.key === ",") {
      e.preventDefault();
      addValue();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save variant");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Variant" : "Add Variant"}
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
            {item ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormField label="Variant Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Size, Color"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Variant Values"
          error={errors.values}
          required
          helperText="Press Enter or comma to add values"
        >
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Small, type and press Enter"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </FormField>

        {formData.values.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-base-200 rounded">
            {formData.values.map((value, index) => (
              <div
                key={index}
                className="badge badge-lg badge-primary gap-2 py-3"
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeValue(index)}
                  className="btn btn-ghost btn-xs"
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </Modal>
  );
}
