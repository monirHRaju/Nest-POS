"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Warehouse, WarehouseInput } from "@/store/api/warehousesApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: Warehouse | null;
  onClose: () => void;
  onSubmit: (data: WarehouseInput) => Promise<void>;
  loading?: boolean;
}

export function WarehouseModal({
  open,
  item,
  onClose,
  onSubmit,
  loading = false,
}: Props) {
  const [formData, setFormData] = useState<WarehouseInput>({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code,
        phone: item.phone || "",
        email: item.email || "",
        address: item.address || "",
        city: item.city || "",
        state: item.state || "",
        country: item.country || "",
        isDefault: item.isDefault,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        country: "",
        isDefault: false,
      });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Warehouse name is required";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Warehouse code is required";
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
      toast.error(err.message || "Failed to save warehouse");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Warehouse" : "Add Warehouse"}
      size="lg"
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Warehouse Name" error={errors.name} required>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Main Warehouse"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
            />
          </FormField>

          <FormField label="Code" error={errors.code} required>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="MAIN"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              disabled={loading}
            />
          </FormField>
        </div>

        <FormField label="Address">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Street address"
            value={formData.address || ""}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="City">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="City"
              value={formData.city || ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              disabled={loading}
            />
          </FormField>

          <FormField label="State">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="State"
              value={formData.state || ""}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              disabled={loading}
            />
          </FormField>

          <FormField label="Country">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Country"
              value={formData.country || ""}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              disabled={loading}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email">
            <input
              type="email"
              className="input input-bordered w-full"
              placeholder="warehouse@company.com"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="tel"
              className="input input-bordered w-full"
              placeholder="+1 (555) 000-0000"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={loading}
            />
          </FormField>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Set as default warehouse</span>
            <input
              type="checkbox"
              className="checkbox"
              checked={formData.isDefault || false}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              disabled={loading}
            />
          </label>
        </div>
      </form>
    </Modal>
  );
}
