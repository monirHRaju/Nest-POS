"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Brand, BrandInput } from "@/store/api/brandsApi";
import toast from "react-hot-toast";

interface BrandModalProps {
  open: boolean;
  brand?: Brand | null;
  onClose: () => void;
  onSubmit: (data: BrandInput) => Promise<void>;
  loading?: boolean;
}

export function BrandModal({
  open,
  brand,
  onClose,
  onSubmit,
  loading = false,
}: BrandModalProps) {
  const [formData, setFormData] = useState<BrandInput>({
    name: "",
    slug: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        slug: brand.slug,
      });
    } else {
      setFormData({ name: "", slug: "" });
    }
    setErrors({});
  }, [brand, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Brand name is required";
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
      toast.error(err.message || "Failed to save brand");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={brand ? "Edit Brand" : "Add Brand"}
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
            {brand ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <FormField label="Brand Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Enter brand name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <FormField label="Slug" helperText="Auto-generated from name if left blank">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="brand-slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  );
}
