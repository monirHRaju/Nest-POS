"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Customer, CustomerInput } from "@/store/api/customersApi";
import { useGetCustomerGroupsQuery } from "@/store/api/customerGroupsApi";

interface Props {
  open: boolean;
  item?: Customer | null;
  onClose: () => void;
  onSubmit: (data: CustomerInput) => Promise<void>;
  loading?: boolean;
}

const empty: CustomerInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  taxNumber: "",
  customerGroupId: "",
  rewardPoints: 0,
  deposit: 0,
  isActive: true,
};

export function CustomerModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<CustomerInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: groupsData } = useGetCustomerGroupsQuery({ pageSize: 100 });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        email: item.email || "",
        phone: item.phone || "",
        address: item.address || "",
        city: item.city || "",
        state: item.state || "",
        country: item.country || "",
        postalCode: item.postalCode || "",
        taxNumber: item.taxNumber || "",
        customerGroupId: item.customerGroupId || "",
        rewardPoints: item.rewardPoints,
        deposit: Number(item.deposit) || 0,
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
    const payload = {
      ...formData,
      customerGroupId: formData.customerGroupId || null,
      email: formData.email || null,
    };
    await onSubmit(payload);
    onClose();
  };

  const set = (k: keyof CustomerInput, v: any) => setFormData({ ...formData, [k]: v });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Customer" : "Add Customer"}
      size="lg"
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
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" error={errors.name} required>
          <input className="input input-bordered w-full" value={formData.name}
            onChange={(e) => set("name", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input type="email" className="input input-bordered w-full" value={formData.email || ""}
            onChange={(e) => set("email", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Phone">
          <input className="input input-bordered w-full" value={formData.phone || ""}
            onChange={(e) => set("phone", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Customer Group">
          <select className="select select-bordered w-full" value={formData.customerGroupId || ""}
            onChange={(e) => set("customerGroupId", e.target.value)} disabled={loading}>
            <option value="">— None —</option>
            {groupsData?.data?.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.discountPercent}%)</option>
            ))}
          </select>
        </FormField>
        <FormField label="Address">
          <input className="input input-bordered w-full" value={formData.address || ""}
            onChange={(e) => set("address", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="City">
          <input className="input input-bordered w-full" value={formData.city || ""}
            onChange={(e) => set("city", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="State">
          <input className="input input-bordered w-full" value={formData.state || ""}
            onChange={(e) => set("state", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Country">
          <input className="input input-bordered w-full" value={formData.country || ""}
            onChange={(e) => set("country", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Postal Code">
          <input className="input input-bordered w-full" value={formData.postalCode || ""}
            onChange={(e) => set("postalCode", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Tax Number">
          <input className="input input-bordered w-full" value={formData.taxNumber || ""}
            onChange={(e) => set("taxNumber", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Reward Points">
          <input type="number" min="0" className="input input-bordered w-full" value={formData.rewardPoints || 0}
            onChange={(e) => set("rewardPoints", parseInt(e.target.value) || 0)} disabled={loading} />
        </FormField>
        <FormField label="Deposit">
          <input type="number" min="0" step="0.01" className="input input-bordered w-full" value={formData.deposit || 0}
            onChange={(e) => set("deposit", parseFloat(e.target.value) || 0)} disabled={loading} />
        </FormField>
        <div className="md:col-span-2">
          <label className="label cursor-pointer justify-start gap-3">
            <input type="checkbox" className="toggle toggle-primary" checked={formData.isActive ?? true}
              onChange={(e) => set("isActive", e.target.checked)} disabled={loading} />
            <span className="label-text">Active</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
