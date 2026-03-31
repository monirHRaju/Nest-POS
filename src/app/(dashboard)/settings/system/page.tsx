"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { baseApi } from "@/store/api/baseApi";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

interface SystemSettings {
  invoicePrefix: string;
  salePrefix: string;
  purchasePrefix: string;
  returnPrefix: string;
  transferPrefix: string;
  quotationPrefix: string;
  expensePrefix: string;
  adjustmentPrefix: string;
  stockCountPrefix: string;
  paymentPrefix: string;
  defaultTaxRate: number;
  allowNegativeStock: boolean;
}

const DEFAULTS: SystemSettings = {
  invoicePrefix: "INV-",
  salePrefix: "SALE-",
  purchasePrefix: "PUR-",
  returnPrefix: "RET-",
  transferPrefix: "TRF-",
  quotationPrefix: "QUO-",
  expensePrefix: "EXP-",
  adjustmentPrefix: "ADJ-",
  stockCountPrefix: "SC-",
  paymentPrefix: "PAY-",
  defaultTaxRate: 0,
  allowNegativeStock: false,
};

export default function SystemSettingsPage() {
  const [formData, setFormData] = useState<SystemSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings/system")
      .then((r) => r.json())
      .then((data) => {
        setFormData({ ...DEFAULTS, ...data });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("System settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const set = (key: keyof SystemSettings, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="System Settings" subtitle="Configure document prefixes, tax defaults, and stock behavior" />

      <div className="space-y-6 max-w-4xl">
        {/* Document Prefixes */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base mb-4">Document Prefixes</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "invoicePrefix", label: "Invoice Prefix" },
                { key: "salePrefix", label: "Sale Prefix" },
                { key: "purchasePrefix", label: "Purchase Prefix" },
                { key: "returnPrefix", label: "Return Prefix" },
                { key: "transferPrefix", label: "Transfer Prefix" },
                { key: "quotationPrefix", label: "Quotation Prefix" },
                { key: "expensePrefix", label: "Expense Prefix" },
                { key: "adjustmentPrefix", label: "Adjustment Prefix" },
                { key: "stockCountPrefix", label: "Stock Count Prefix" },
                { key: "paymentPrefix", label: "Payment Prefix" },
              ].map(({ key, label }) => (
                <div key={key} className="form-control">
                  <label className="label">
                    <span className="label-text">{label}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData[key as keyof SystemSettings] as string}
                    onChange={(e) => set(key as keyof SystemSettings, e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tax & Stock */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base mb-4">Tax & Stock</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Default Tax Rate (%)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.defaultTaxRate}
                  onChange={(e) => set("defaultTaxRate", parseFloat(e.target.value) || 0)}
                  disabled={isSaving}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Negative Stock</span>
                </label>
                <label className="label cursor-pointer justify-start gap-4 h-12">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.allowNegativeStock}
                    onChange={(e) => set("allowNegativeStock", e.target.checked)}
                    disabled={isSaving}
                  />
                  <span className="label-text">Allow selling below zero stock</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
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
