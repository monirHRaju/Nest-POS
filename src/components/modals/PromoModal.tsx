"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Promo, PromoInput, PromoType } from "@/store/api/promosApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: Promo | null;
  onClose: () => void;
  onSubmit: (data: PromoInput) => Promise<void>;
  loading?: boolean;
}

const isoDate = (d?: string) => (d ? d.slice(0, 10) : "");

export function PromoModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<PromoInput>({
    name: "",
    code: "",
    type: "PERCENTAGE",
    value: 0,
    minimumAmount: 0,
    startDate: isoDate(new Date().toISOString()),
    endDate: isoDate(new Date(Date.now() + 30 * 86400000).toISOString()),
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code,
        type: item.type,
        value: Number(item.value),
        minimumAmount: Number(item.minimumAmount),
        startDate: isoDate(item.startDate),
        endDate: isoDate(item.endDate),
        isActive: item.isActive,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        type: "PERCENTAGE",
        value: 0,
        minimumAmount: 0,
        startDate: isoDate(new Date().toISOString()),
        endDate: isoDate(new Date(Date.now() + 30 * 86400000).toISOString()),
        isActive: true,
      });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Required";
    if (!formData.code.trim()) e.code = "Required";
    if (formData.value <= 0) e.value = "Must be > 0";
    if (formData.type === "PERCENTAGE" && formData.value > 100) e.value = "Max 100%";
    if (new Date(formData.endDate) < new Date(formData.startDate)) e.endDate = "End must be after start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save promo");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Promo" : "Add Promo"}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>Cancel</button>
          <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            {item ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" error={errors.name} required>
            <input className="input input-bordered w-full" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={loading} />
          </FormField>
          <FormField label="Code" error={errors.code} required>
            <input className="input input-bordered w-full" value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} disabled={loading} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Type">
            <select className="select select-bordered w-full" value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PromoType })} disabled={loading}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </FormField>
          <FormField label="Value" error={errors.value} required>
            <input type="number" min={0} step="0.01" className="input input-bordered w-full"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} disabled={loading} />
          </FormField>
          <FormField label="Min Amount">
            <input type="number" min={0} step="0.01" className="input input-bordered w-full"
              value={formData.minimumAmount ?? 0}
              onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || 0 })} disabled={loading} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" required>
            <input type="date" className="input input-bordered w-full" value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} disabled={loading} />
          </FormField>
          <FormField label="End Date" error={errors.endDate} required>
            <input type="date" className="input input-bordered w-full" value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} disabled={loading} />
          </FormField>
        </div>

        <label className="cursor-pointer flex items-center gap-2">
          <input type="checkbox" className="checkbox" checked={formData.isActive ?? true}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={loading} />
          <span>Active</span>
        </label>
      </form>
    </Modal>
  );
}
