"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { PermissionGroup, PermissionGroupInput } from "@/store/api/permissionsApi";
import toast from "react-hot-toast";

const MODULES = [
  { key: "products",   label: "Products" },
  { key: "purchases",  label: "Purchases" },
  { key: "sales",      label: "Sales & POS" },
  { key: "returns",    label: "Returns" },
  { key: "transfers",  label: "Transfers" },
  { key: "quotations", label: "Quotations" },
  { key: "expenses",   label: "Expenses" },
  { key: "hr",         label: "HR / People" },
  { key: "reports",    label: "Reports" },
  { key: "settings",   label: "Settings" },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;
type Action = (typeof ACTIONS)[number];

function buildAllKeys(): string[] {
  return MODULES.flatMap((m) => ACTIONS.map((a) => `${m.key}.${a}`));
}

function buildEmptyPermissions(): Record<string, boolean> {
  return Object.fromEntries(buildAllKeys().map((k) => [k, false]));
}

interface Props {
  open: boolean;
  item?: PermissionGroup | null;
  onClose: () => void;
  onSubmit: (data: PermissionGroupInput) => Promise<void>;
  loading?: boolean;
}

export function PermissionGroupModal({ open, item, onClose, onSubmit, loading = false }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>(buildEmptyPermissions);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
      setPermissions({ ...buildEmptyPermissions(), ...item.permissions });
    } else {
      setName("");
      setDescription("");
      setPermissions(buildEmptyPermissions());
    }
    setErrors({});
  }, [item, open]);

  const toggleKey = (key: string) =>
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleRow = (moduleKey: string) => {
    const rowKeys = ACTIONS.map((a) => `${moduleKey}.${a}`);
    const allChecked = rowKeys.every((k) => permissions[k]);
    setPermissions((prev) => ({
      ...prev,
      ...Object.fromEntries(rowKeys.map((k) => [k, !allChecked])),
    }));
  };

  const toggleCol = (action: Action) => {
    const colKeys = MODULES.map((m) => `${m.key}.${action}`);
    const allChecked = colKeys.every((k) => permissions[k]);
    setPermissions((prev) => ({
      ...prev,
      ...Object.fromEntries(colKeys.map((k) => [k, !allChecked])),
    }));
  };

  const toggleAll = () => {
    const allKeys = buildAllKeys();
    const allChecked = allKeys.every((k) => permissions[k]);
    setPermissions(Object.fromEntries(allKeys.map((k) => [k, !allChecked])));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Group name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit({ name, description: description || undefined, permissions });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const allChecked = buildAllKeys().every((k) => permissions[k]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Edit Permission Group" : "Add Permission Group"}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-outline" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm"></span>}
            {item ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Group Name" error={errors.name} required>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g., Sales Staff, Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </FormField>
          <FormField label="Description">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </FormField>
        </div>

        {/* Permission Matrix */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Permissions</span>
            <button
              type="button"
              onClick={toggleAll}
              className="btn btn-xs btn-ghost"
              disabled={loading}
            >
              {allChecked ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="overflow-x-auto border border-base-300 rounded-lg">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="w-36">Module</th>
                  {ACTIONS.map((action) => (
                    <th key={action} className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleCol(action)}
                        className="capitalize font-semibold hover:text-primary transition-colors"
                        disabled={loading}
                        title={`Toggle all ${action}`}
                      >
                        {action}
                      </button>
                    </th>
                  ))}
                  <th className="text-center">All</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => {
                  const rowKeys = ACTIONS.map((a) => `${mod.key}.${a}`);
                  const rowAll = rowKeys.every((k) => permissions[k]);
                  return (
                    <tr key={mod.key} className="hover">
                      <td className="font-medium">{mod.label}</td>
                      {ACTIONS.map((action) => {
                        const key = `${mod.key}.${action}`;
                        return (
                          <td key={action} className="text-center">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm"
                              checked={permissions[key] || false}
                              onChange={() => toggleKey(key)}
                              disabled={loading}
                            />
                          </td>
                        );
                      })}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-secondary checkbox-sm"
                          checked={rowAll}
                          onChange={() => toggleRow(mod.key)}
                          disabled={loading}
                          title="Toggle row"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
