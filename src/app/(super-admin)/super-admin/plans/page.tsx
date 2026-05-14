"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
  features: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  tenantCount: number;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  maxUsers: 5,
  maxWarehouses: 1,
  maxProducts: 500,
  isActive: true,
  sortOrder: 0,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/v1/super-admin/plans");
    const d = await res.json();
    setPlans(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice,
      maxUsers: p.maxUsers,
      maxWarehouses: p.maxWarehouses,
      maxProducts: p.maxProducts,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/v1/super-admin/plans/${editing.id}` : "/api/v1/super-admin/plans";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      toast.success(editing ? "Plan updated" : "Plan created");
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Plan) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    const res = await fetch(`/api/v1/super-admin/plans/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      await load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plans</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Plan</button>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th className="text-right">Monthly</th>
                  <th className="text-right">Yearly</th>
                  <th className="text-right">Users</th>
                  <th className="text-right">Warehouses</th>
                  <th className="text-right">Products</th>
                  <th className="text-right">Tenants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
                ) : plans.length ? plans.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td className="font-mono text-xs">{p.slug}</td>
                    <td className="text-right font-mono">${p.monthlyPrice.toFixed(2)}</td>
                    <td className="text-right font-mono">${p.yearlyPrice.toFixed(2)}</td>
                    <td className="text-right">{p.maxUsers}</td>
                    <td className="text-right">{p.maxWarehouses}</td>
                    <td className="text-right">{p.maxProducts}</td>
                    <td className="text-right">{p.tenantCount}</td>
                    <td>
                      {p.isActive ? <span className="badge badge-success badge-sm">Active</span>
                        : <span className="badge badge-sm">Inactive</span>}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-xs btn-ghost" onClick={() => openEdit(p)}>✎</button>
                        <button className="btn btn-xs btn-ghost text-error" onClick={() => remove(p)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={10} className="text-center py-8 text-base-content/50">No plans yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{editing ? "Edit Plan" : "New Plan"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text text-xs mb-1">Name</span>
                <input className="input input-bordered input-sm" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Slug (lowercase, hyphens)</span>
                <input className="input input-bordered input-sm font-mono" value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>
              <label className="form-control col-span-2">
                <span className="label-text text-xs mb-1">Description</span>
                <textarea className="textarea textarea-bordered textarea-sm" rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Monthly Price ($)</span>
                <input type="number" min={0} step="0.01" className="input input-bordered input-sm"
                  value={form.monthlyPrice}
                  onChange={(e) => setForm({ ...form, monthlyPrice: parseFloat(e.target.value) || 0 })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Yearly Price ($)</span>
                <input type="number" min={0} step="0.01" className="input input-bordered input-sm"
                  value={form.yearlyPrice}
                  onChange={(e) => setForm({ ...form, yearlyPrice: parseFloat(e.target.value) || 0 })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Max Users</span>
                <input type="number" min={1} className="input input-bordered input-sm" value={form.maxUsers}
                  onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 1 })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Max Warehouses</span>
                <input type="number" min={1} className="input input-bordered input-sm" value={form.maxWarehouses}
                  onChange={(e) => setForm({ ...form, maxWarehouses: parseInt(e.target.value) || 1 })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Max Products</span>
                <input type="number" min={1} className="input input-bordered input-sm" value={form.maxProducts}
                  onChange={(e) => setForm({ ...form, maxProducts: parseInt(e.target.value) || 1 })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Sort Order</span>
                <input type="number" className="input input-bordered input-sm" value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </label>
              <label className="cursor-pointer flex items-center gap-2 col-span-2 mt-2">
                <input type="checkbox" className="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <span>Active</span>
              </label>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving && <span className="loading loading-spinner loading-sm" />}
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
