"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Category, CategoryInput, useGetCategoriesQuery } from "@/store/api/categoriesApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: Category | null;
  onClose: () => void;
  onSubmit: (data: CategoryInput) => Promise<void>;
  loading?: boolean;
}

export function CategoryModal({
  open,
  item,
  onClose,
  onSubmit,
  loading = false,
}: Props) {
  const [formData, setFormData] = useState<CategoryInput>({
    name: "",
    slug: "",
    parentId: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch all categories for parent dropdown (exclude self from options)
  const { data: categoriesData } = useGetCategoriesQuery(
    { page: 1, pageSize: 100, search: "" },
    { skip: !open }
  );

  const parentOptions = (categoriesData?.data || []).filter(
    (cat) => cat.id !== item?.id // Prevent selecting self as parent
  );

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        slug: item.slug,
        parentId: item.parentId,
      });
    } else {
      setFormData({ name: "", slug: "", parentId: null });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
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
      toast.error(err.message || "Failed to save category");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Category" : "Add Category"}
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
        <FormField label="Category Name" error={errors.name} required>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g., Vegetables, Fruits"
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
            placeholder="category-slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            disabled={loading}
          />
        </FormField>

        <FormField label="Parent Category" helperText="Leave empty for top-level categories">
          <select
            className="select select-bordered w-full"
            value={formData.parentId || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                parentId: e.target.value || null,
              })
            }
            disabled={loading}
          >
            <option value="">None (Top-level)</option>
            {parentOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parent?.name ? `${cat.parent.name} → ${cat.name}` : cat.name}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Modal>
  );
}
