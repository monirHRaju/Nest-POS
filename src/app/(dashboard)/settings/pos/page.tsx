"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import toast from "react-hot-toast";

interface POSSettings {
  showProductImages: boolean;
  showProductPrices: boolean;
  autoFocusSearch: boolean;
  enableKeyboardShortcuts: boolean;
  enableHoldOrders: boolean;
  autoPrint: boolean;
  receiptHeader: string;
  receiptFooter: string;
  showReceiptLogo: boolean;
  productsPerPage: number;
}

const DEFAULTS: POSSettings = {
  showProductImages: true,
  showProductPrices: true,
  autoFocusSearch: true,
  enableKeyboardShortcuts: true,
  enableHoldOrders: true,
  autoPrint: false,
  receiptHeader: "",
  receiptFooter: "",
  showReceiptLogo: true,
  productsPerPage: 24,
};

export default function POSSettingsPage() {
  const [formData, setFormData] = useState<POSSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings/pos")
      .then((r) => r.json())
      .then((data) => {
        setFormData({
          ...DEFAULTS,
          ...data,
          receiptHeader: data.receiptHeader || "",
          receiptFooter: data.receiptFooter || "",
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/settings/pos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          receiptHeader: formData.receiptHeader || null,
          receiptFooter: formData.receiptFooter || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("POS settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const set = (key: keyof POSSettings, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const Toggle = ({
    field,
    label,
  }: {
    field: keyof POSSettings;
    label: string;
  }) => (
    <label className="label cursor-pointer justify-between px-0">
      <span className="label-text">{label}</span>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={formData[field] as boolean}
        onChange={(e) => set(field, e.target.checked)}
        disabled={isSaving}
      />
    </label>
  );

  return (
    <>
      <PageHeader
        title="POS Settings"
        subtitle="Configure the point of sale interface and receipt options"
      />

      <div className="space-y-6 max-w-4xl">
        {/* Display */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">Display</h2>
            <div className="divide-y divide-base-200">
              <Toggle field="showProductImages" label="Show product images in POS grid" />
              <Toggle field="showProductPrices" label="Show product prices in POS grid" />
            </div>
          </div>
        </div>

        {/* Behavior */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">Behavior</h2>
            <div className="divide-y divide-base-200">
              <Toggle field="autoFocusSearch" label="Auto-focus barcode search on idle" />
              <Toggle field="enableKeyboardShortcuts" label="Enable keyboard shortcuts (Ctrl+Enter to pay)" />
              <Toggle field="enableHoldOrders" label="Enable hold / recall orders" />
            </div>
          </div>
        </div>

        {/* Receipt */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base mb-4">Receipt</h2>
            <div className="divide-y divide-base-200 mb-4">
              <Toggle field="autoPrint" label="Auto-print receipt after every sale" />
              <Toggle field="showReceiptLogo" label="Show company logo on receipt" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Receipt Header</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={3}
                  placeholder="Text printed above items (e.g., Welcome!)"
                  value={formData.receiptHeader}
                  onChange={(e) => set("receiptHeader", e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Receipt Footer</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={3}
                  placeholder="Text printed below totals (e.g., Thank you!)"
                  value={formData.receiptFooter}
                  onChange={(e) => set("receiptFooter", e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products per page */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base mb-4">Product Grid</h2>
            <div className="form-control max-w-xs">
              <label className="label">
                <span className="label-text">Products Per Page</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.productsPerPage}
                onChange={(e) => set("productsPerPage", parseInt(e.target.value))}
                disabled={isSaving}
              >
                {[12, 16, 20, 24, 32, 48].map((n) => (
                  <option key={n} value={n}>
                    {n} products
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="btn btn-primary btn-wide"
            disabled={isSaving}
          >
            {isSaving && <span className="loading loading-spinner loading-sm"></span>}
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
