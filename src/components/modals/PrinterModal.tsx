"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Printer, PrinterInput, PrinterType, PrinterConnectionType } from "@/store/api/printersApi";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  item?: Printer | null;
  onClose: () => void;
  onSubmit: (data: PrinterInput) => Promise<void>;
  loading?: boolean;
}

const TYPES: PrinterType[] = ["RECEIPT", "BARCODE", "KITCHEN", "REPORT"];
const CONNS: PrinterConnectionType[] = ["BROWSER", "USB", "NETWORK", "BLUETOOTH"];

export function PrinterModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [formData, setFormData] = useState<PrinterInput>({
    name: "",
    type: "RECEIPT",
    connectionType: "BROWSER",
    ipAddress: "",
    port: null,
    characterWidth: 48,
    isDefault: false,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        type: item.type,
        connectionType: item.connectionType,
        ipAddress: item.ipAddress ?? "",
        port: item.port,
        characterWidth: item.characterWidth,
        isDefault: item.isDefault,
        isActive: item.isActive,
      });
    } else {
      setFormData({
        name: "",
        type: "RECEIPT",
        connectionType: "BROWSER",
        ipAddress: "",
        port: null,
        characterWidth: 48,
        isDefault: false,
        isActive: true,
      });
    }
    setErrors({});
  }, [item, open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Name required";
    if (formData.connectionType === "NETWORK" && !formData.ipAddress?.trim())
      e.ipAddress = "IP required for network printer";
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
      toast.error(err.message || "Failed to save printer");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Printer" : "Add Printer"}
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
          <FormField label="Type">
            <select className="select select-bordered w-full" value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PrinterType })} disabled={loading}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Connection">
            <select className="select select-bordered w-full" value={formData.connectionType}
              onChange={(e) => setFormData({ ...formData, connectionType: e.target.value as PrinterConnectionType })} disabled={loading}>
              {CONNS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Character Width">
            <input type="number" min={20} max={80} className="input input-bordered w-full"
              value={formData.characterWidth ?? 48}
              onChange={(e) => setFormData({ ...formData, characterWidth: parseInt(e.target.value) || 48 })} disabled={loading} />
          </FormField>
        </div>

        {formData.connectionType === "NETWORK" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="IP Address" error={errors.ipAddress}>
              <input className="input input-bordered w-full" placeholder="192.168.1.100"
                value={formData.ipAddress ?? ""}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} disabled={loading} />
            </FormField>
            <FormField label="Port">
              <input type="number" className="input input-bordered w-full" placeholder="9100"
                value={formData.port ?? ""}
                onChange={(e) => setFormData({ ...formData, port: e.target.value ? parseInt(e.target.value) : null })} disabled={loading} />
            </FormField>
          </div>
        )}

        <div className="flex gap-6">
          <label className="cursor-pointer flex items-center gap-2">
            <input type="checkbox" className="checkbox" checked={formData.isDefault ?? false}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} disabled={loading} />
            <span>Default printer</span>
          </label>
          <label className="cursor-pointer flex items-center gap-2">
            <input type="checkbox" className="checkbox" checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={loading} />
            <span>Active</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
