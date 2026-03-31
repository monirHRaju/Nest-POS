"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ExpenseCategory, CategoryInput } from "@/store/api/expenseCategoriesApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: ExpenseCategory | null;
  onClose: () => void;
  onSubmit: (data: CategoryInput) => Promise<void>;
  loading?: boolean;
}

export function ExpenseCategoryModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<CategoryInput>({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({ name: item.name, description: item.description || "" });
    } else {
      setFormData({ name: "", description: "" });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
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
      title={item ? "Edit Expense Category" : "Add Expense Category"}
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
        <FormField label="Category Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Office Supplies"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </FormField>
        <FormField label="Description">
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Description"
            rows={3}
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
          ></textarea>
        </FormField>
      </form>
    </Modal>
  );
}
