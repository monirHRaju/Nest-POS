"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Biller, BillerInput } from "@/store/api/billersApi";

interface Props {
  open: boolean;
  item?: Biller | null;
  onClose: () => void;
  onSubmit: (data: BillerInput) => Promise<void>;
  loading?: boolean;
}

const empty: BillerInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  company: "",
  taxNumber: "",
  isActive: true,
};

export function BillerModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<BillerInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        email: item.email || "",
        phone: item.phone || "",
        address: item.address || "",
        company: item.company || "",
        taxNumber: item.taxNumber || "",
        isActive: item.isActive,
      });
    } else {
      setFormData(empty);
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = "Name required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Invalid email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    await onSubmit({ ...formData, email: formData.email || null });
    onClose();
  };

  const set = (k: keyof BillerInput, v: any) => setFormData({ ...formData, [k]: v });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Biller" : "Add Biller"}
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
      <form className="space-y-4">
        <FormField label="Name" error={errors.name} required>
          <input className="input input-bordered w-full" value={formData.name}
            onChange={(e) => set("name", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Company">
          <input className="input input-bordered w-full" value={formData.company || ""}
            onChange={(e) => set("company", e.target.value)} disabled={loading} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" error={errors.email}>
            <input type="email" className="input input-bordered w-full" value={formData.email || ""}
              onChange={(e) => set("email", e.target.value)} disabled={loading} />
          </FormField>
          <FormField label="Phone">
            <input className="input input-bordered w-full" value={formData.phone || ""}
              onChange={(e) => set("phone", e.target.value)} disabled={loading} />
          </FormField>
        </div>
        <FormField label="Tax Number">
          <input className="input input-bordered w-full" value={formData.taxNumber || ""}
            onChange={(e) => set("taxNumber", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Address">
          <input className="input input-bordered w-full" value={formData.address || ""}
            onChange={(e) => set("address", e.target.value)} disabled={loading} />
        </FormField>
        <label className="label cursor-pointer justify-start gap-3">
          <input type="checkbox" className="toggle toggle-primary" checked={formData.isActive ?? true}
            onChange={(e) => set("isActive", e.target.checked)} disabled={loading} />
          <span className="label-text">Active</span>
        </label>
      </form>
    </Modal>
  );
}
