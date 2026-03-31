"use client";

import { useState, useEffect } from "react";
import { FormField } from "@/components/ui/FormField";
import { Product, ProductInput } from "@/store/api/productsApi";
import { useGetCategoriesQuery } from "@/store/api/categoriesApi";
import { useGetBrandsQuery } from "@/store/api/brandsApi";
import { useGetUnitsQuery } from "@/store/api/unitsApi";
import { useGetTaxRatesQuery } from "@/store/api/taxRatesApi";

interface Props {
  product?: Product;
  onSubmit: (data: ProductInput) => Promise<void>;
  loading?: boolean;
}

function generateCode(): string {
  return "PRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const BARCODE_SYMBOLOGIES = ["CODE128", "CODE39", "EAN13", "EAN8", "UPC", "ITF14", "QR"];

export function ProductForm({ product, onSubmit, loading = false }: Props) {
  const [form, setForm] = useState<ProductInput>({
    name: "",
    code: "",
    type: "STANDARD",
    barcodeSymbology: "CODE128",
    categoryId: null,
    brandId: null,
    unitId: null,
    taxId: null,
    taxMethod: "EXCLUSIVE",
    costPrice: 0,
    sellingPrice: 0,
    wholesalePrice: null,
    minimumPrice: null,
    alertQuantity: 0,
    description: null,
    image: null,
    images: [],
    hasVariants: false,
    hasSerialNumber: false,
    isBatchTracking: false,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [additionalImages, setAdditionalImages] = useState<string[]>([""]);

  const { data: categoriesData } = useGetCategoriesQuery({ pageSize: 200 });
  const { data: brandsData } = useGetBrandsQuery({ pageSize: 200 });
  const { data: unitsData } = useGetUnitsQuery({ pageSize: 200 });
  const { data: taxRatesData } = useGetTaxRatesQuery({ pageSize: 200 });

  // Parent categories only
  const parentCategories = categoriesData?.data.filter((c) => !c.parentId) ?? [];
  const allCategories = categoriesData?.data ?? [];

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        code: product.code,
        type: product.type,
        barcodeSymbology: product.barcodeSymbology,
        categoryId: product.categoryId ?? null,
        brandId: product.brandId ?? null,
        unitId: product.unitId ?? null,
        taxId: product.taxId ?? null,
        taxMethod: product.taxMethod,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
        minimumPrice: product.minimumPrice ? Number(product.minimumPrice) : null,
        alertQuantity: Number(product.alertQuantity),
        description: product.description ?? null,
        image: product.image ?? null,
        images: product.images ?? [],
        hasVariants: product.hasVariants,
        hasSerialNumber: product.hasSerialNumber,
        isBatchTracking: product.isBatchTracking,
        isActive: product.isActive,
      });
      setAdditionalImages(product.images.length > 0 ? [...product.images, ""] : [""]);
    }
  }, [product]);

  const set = (field: keyof ProductInput, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.code.trim()) errs.code = "Product code is required";
    if (form.costPrice < 0) errs.costPrice = "Cost price must be ≥ 0";
    if (form.sellingPrice < 0) errs.sellingPrice = "Selling price must be ≥ 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdditionalImage = (idx: number, val: string) => {
    const updated = [...additionalImages];
    updated[idx] = val;
    // Auto-add empty slot at end
    if (idx === updated.length - 1 && val) updated.push("");
    setAdditionalImages(updated);
    set("images", updated.filter(Boolean));
  };

  const removeAdditionalImage = (idx: number) => {
    const updated = additionalImages.filter((_, i) => i !== idx);
    if (updated.length === 0) updated.push("");
    setAdditionalImages(updated);
    set("images", updated.filter(Boolean));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ ...form, images: additionalImages.filter(Boolean) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Product Name" error={errors.name} required>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="e.g., Organic Tomatoes"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    disabled={loading}
                  />
                </FormField>
                <FormField label="Product Code" error={errors.code} required>
                  <div className="join w-full">
                    <input
                      type="text"
                      className="input input-bordered join-item flex-1"
                      placeholder="e.g., TOM-001"
                      value={form.code}
                      onChange={(e) => set("code", e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline join-item"
                      onClick={() => set("code", generateCode())}
                      disabled={loading}
                      title="Auto-generate code"
                    >
                      ⟳
                    </button>
                  </div>
                </FormField>
                <FormField label="Product Type">
                  <select
                    className="select select-bordered w-full"
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                    disabled={loading}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="SERVICE">Service</option>
                    <option value="COMBO">Combo</option>
                  </select>
                </FormField>
                <FormField label="Barcode Symbology">
                  <select
                    className="select select-bordered w-full"
                    value={form.barcodeSymbology}
                    onChange={(e) => set("barcodeSymbology", e.target.value)}
                    disabled={loading}
                  >
                    {BARCODE_SYMBOLOGIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Classification</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category">
                  <select
                    className="select select-bordered w-full"
                    value={form.categoryId ?? ""}
                    onChange={(e) => set("categoryId", e.target.value || null)}
                    disabled={loading}
                  >
                    <option value="">No Category</option>
                    {parentCategories.map((c) => (
                      <optgroup key={c.id} label={c.name}>
                        <option value={c.id}>{c.name}</option>
                        {allCategories
                          .filter((sub) => sub.parentId === c.id)
                          .map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              &nbsp;&nbsp;{sub.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                    {/* Top-level categories without parent shown once */}
                    {allCategories
                      .filter((c) => c.parentId && !parentCategories.find((p) => p.id === c.parentId))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </FormField>
                <FormField label="Brand">
                  <select
                    className="select select-bordered w-full"
                    value={form.brandId ?? ""}
                    onChange={(e) => set("brandId", e.target.value || null)}
                    disabled={loading}
                  >
                    <option value="">No Brand</option>
                    {brandsData?.data.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Unit">
                  <select
                    className="select select-bordered w-full"
                    value={form.unitId ?? ""}
                    onChange={(e) => set("unitId", e.target.value || null)}
                    disabled={loading}
                  >
                    <option value="">No Unit</option>
                    {unitsData?.data.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Description</h2>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                placeholder="Product description (optional)"
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value || null)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Images */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Images</h2>
              <FormField label="Primary Image URL">
                <input
                  type="url"
                  className="input input-bordered w-full"
                  placeholder="https://example.com/image.jpg"
                  value={form.image ?? ""}
                  onChange={(e) => set("image", e.target.value || null)}
                  disabled={loading}
                />
              </FormField>
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Additional Images</p>
                {additionalImages.map((url, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      className="input input-bordered flex-1"
                      placeholder="https://example.com/image.jpg"
                      value={url}
                      onChange={(e) => handleAdditionalImage(idx, e.target.value)}
                      disabled={loading}
                    />
                    {additionalImages.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeAdditionalImage(idx)}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Variants toggle */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-base">Product Variants</h2>
                  <p className="text-sm text-base-content/60">
                    Enable if this product has different sizes, colors, etc.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.hasVariants}
                  onChange={(e) => set("hasVariants", e.target.checked)}
                  disabled={loading}
                />
              </div>
              {form.hasVariants && (
                <div className="alert alert-info mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Variant combinations can be managed after saving the product.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pricing, Tax, Stock */}
        <div className="space-y-4">
          {/* Pricing */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Pricing</h2>
              <FormField label="Cost Price" error={errors.costPrice} required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  value={form.costPrice}
                  onChange={(e) => set("costPrice", parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </FormField>
              <FormField label="Selling Price" error={errors.sellingPrice} required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  value={form.sellingPrice}
                  onChange={(e) => set("sellingPrice", parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </FormField>
              <FormField label="Wholesale Price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  placeholder="Optional"
                  value={form.wholesalePrice ?? ""}
                  onChange={(e) => set("wholesalePrice", e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={loading}
                />
              </FormField>
              <FormField label="Minimum Price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  placeholder="Optional"
                  value={form.minimumPrice ?? ""}
                  onChange={(e) => set("minimumPrice", e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Tax */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Tax</h2>
              <FormField label="Tax Rate">
                <select
                  className="select select-bordered w-full"
                  value={form.taxId ?? ""}
                  onChange={(e) => set("taxId", e.target.value || null)}
                  disabled={loading}
                >
                  <option value="">No Tax</option>
                  {taxRatesData?.data.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tax Method">
                <div className="flex gap-4">
                  {(["EXCLUSIVE", "INCLUSIVE"] as const).map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="radio radio-primary"
                        checked={form.taxMethod === method}
                        onChange={() => set("taxMethod", method)}
                        disabled={loading}
                      />
                      <span className="text-sm">{method.charAt(0) + method.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </FormField>
            </div>
          </div>

          {/* Stock Control */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Stock Control</h2>
              <FormField label="Alert Quantity" helperText="Low stock warning threshold">
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input input-bordered w-full"
                  value={form.alertQuantity}
                  onChange={(e) => set("alertQuantity", parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </FormField>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Has Serial Number</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={form.hasSerialNumber}
                  onChange={(e) => set("hasSerialNumber", e.target.checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Batch Tracking</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={form.isBatchTracking}
                  onChange={(e) => set("isBatchTracking", e.target.checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Active</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-success"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm"></span>}
            {product ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </form>
  );
}
