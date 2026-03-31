"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { CustomerGroup, GroupInput } from "@/store/api/customerGroupsApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: CustomerGroup | null;
  onClose: () => void;
  onSubmit: (data: GroupInput) => Promise<void>;
  loading?: boolean;
}

export function CustomerGroupModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<GroupInput>({ name: "", discountPercent: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({ name: item.name, discountPercent: item.discountPercent });
    } else {
      setFormData({ name: "", discountPercent: 0 });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if ((formData.discountPercent || 0) < 0 || (formData.discountPercent || 0) > 100) {
      newErrors.discountPercent = "Discount must be between 0 and 100";
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
      toast.error(err.message || "Failed to save");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Customer Group" : "Add Customer Group"}
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
        <FormField label="Group Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Retail, Wholesale"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </FormField>
        <FormField label="Default Discount %" error={errors.discountPercent}>
          <input
            type="number"
            className="input input-bordered w-full"
            placeholder="0"
            min="0"
            max="100"
            step="0.01"
            value={formData.discountPercent || 0}
            onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
}
