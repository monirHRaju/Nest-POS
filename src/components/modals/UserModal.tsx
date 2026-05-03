"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { AppUser, UserInput, UserRole } from "@/store/api/usersApi";
import { useGetPermissionGroupsQuery } from "@/store/api/permissionsApi";
import { useGetWarehousesQuery } from "@/store/api/warehousesApi";

interface Props {
  open: boolean;
  item?: AppUser | null;
  onClose: () => void;
  onSubmit: (data: UserInput) => Promise<void>;
  loading?: boolean;
}

const empty: UserInput = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  role: "USER",
  groupId: "",
  warehouseId: "",
  isActive: true,
};

const ROLES: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "USER"];

export function UserModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<UserInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: groupsData } = useGetPermissionGroupsQuery({ pageSize: 100 });
  const { data: warehousesData } = useGetWarehousesQuery({ pageSize: 100 });

  useEffect(() => {
    if (item) {
      setFormData({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        password: "",
        phone: item.phone || "",
        role: item.role,
        groupId: item.groupId || "",
        warehouseId: item.warehouseId || "",
        isActive: item.isActive,
      });
    } else {
      setFormData(empty);
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.firstName.trim()) e.firstName = "Required";
    if (!formData.lastName.trim()) e.lastName = "Required";
    if (!formData.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email";
    if (!item && (!formData.password || formData.password.length < 6)) {
      e.password = "Password min 6 chars";
    }
    if (item && formData.password && formData.password.length < 6) {
      e.password = "Password min 6 chars";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload: UserInput = {
      ...formData,
      groupId: formData.groupId || null,
      warehouseId: formData.warehouseId || null,
    };
    if (item && !payload.password) delete payload.password;
    await onSubmit(payload);
    onClose();
  };

  const set = (k: keyof UserInput, v: any) => setFormData({ ...formData, [k]: v });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit User" : "Add User"}
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
        <FormField label="First Name" error={errors.firstName} required>
          <input className="input input-bordered w-full" value={formData.firstName}
            onChange={(e) => set("firstName", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Last Name" error={errors.lastName} required>
          <input className="input input-bordered w-full" value={formData.lastName}
            onChange={(e) => set("lastName", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Email" error={errors.email} required>
          <input type="email" className="input input-bordered w-full" value={formData.email}
            onChange={(e) => set("email", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Phone">
          <input className="input input-bordered w-full" value={formData.phone || ""}
            onChange={(e) => set("phone", e.target.value)} disabled={loading} />
        </FormField>
        <FormField
          label={item ? "Password (leave empty to keep)" : "Password"}
          error={errors.password}
          required={!item}
        >
          <input type="password" className="input input-bordered w-full" value={formData.password || ""}
            onChange={(e) => set("password", e.target.value)} disabled={loading} />
        </FormField>
        <FormField label="Role" required>
          <select className="select select-bordered w-full" value={formData.role}
            onChange={(e) => set("role", e.target.value as UserRole)} disabled={loading}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>
        <FormField label="Permission Group">
          <select className="select select-bordered w-full" value={formData.groupId || ""}
            onChange={(e) => set("groupId", e.target.value)} disabled={loading}>
            <option value="">— None —</option>
            {groupsData?.data?.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Default Warehouse">
          <select className="select select-bordered w-full" value={formData.warehouseId || ""}
            onChange={(e) => set("warehouseId", e.target.value)} disabled={loading}>
            <option value="">— None —</option>
            {warehousesData?.data?.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
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
