"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  currency: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  isActive: boolean;
  plan: { id: string; name: string; slug: string } | null;
  maxUsers: number;
  maxWarehouses: number;
  maxProducts: number;
  userCount: number;
  warehouseCount: number;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
}

const STATUS_BADGE: Record<string, string> = {
  TRIAL: "badge-info",
  ACTIVE: "badge-success",
  PAST_DUE: "badge-warning",
  CANCELED: "badge-error",
  EXPIRED: "badge-error",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tenant | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (statusFilter) qs.set("status", statusFilter);
    const res = await fetch(`/api/v1/super-admin/tenants?${qs}`);
    const d = await res.json();
    setTenants(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  useEffect(() => {
    fetch("/api/v1/super-admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.data ?? []));
  }, []);

  const updateTenant = async (patch: Record<string, unknown>) => {
    if (!editing) return;
    const res = await fetch(`/api/v1/super-admin/tenants/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Updated");
      setEditing(null);
      await load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
      </div>

      <div className="flex gap-2">
        <input className="input input-bordered input-sm flex-1" placeholder="Search..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select select-bordered select-sm" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="CANCELED">Canceled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Trial Ends</th>
                  <th className="text-right">Users</th>
                  <th className="text-right">Warehouses</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
                ) : tenants.length ? tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold">{t.name}</td>
                    <td className="font-mono text-xs">{t.slug}</td>
                    <td className="text-xs">{t.email ?? "—"}</td>
                    <td>{t.plan?.name ?? <span className="text-base-content/40">Unassigned</span>}</td>
                    <td>
                      <span className={`badge badge-sm ${STATUS_BADGE[t.subscriptionStatus] ?? ""}`}>
                        {t.subscriptionStatus}
                      </span>
                      {!t.isActive && <span className="badge badge-sm ml-1">Suspended</span>}
                    </td>
                    <td className="text-xs">
                      {t.trialEndsAt ? format(new Date(t.trialEndsAt), "dd-MM-yyyy") : "—"}
                    </td>
                    <td className="text-right">{t.userCount}/{t.maxUsers}</td>
                    <td className="text-right">{t.warehouseCount}/{t.maxWarehouses}</td>
                    <td className="text-xs">{format(new Date(t.createdAt), "dd-MM-yyyy")}</td>
                    <td>
                      <button className="btn btn-xs btn-ghost" onClick={() => setEditing(t)}>Manage</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={10} className="text-center py-8 text-base-content/50">No tenants</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <div className="modal modal-open">
          <div className="modal-box max-w-xl">
            <h3 className="font-bold text-lg">Manage: {editing.name}</h3>
            <p className="text-sm text-base-content/60 mb-4 font-mono">{editing.slug}</p>

            <div className="space-y-4">
              <label className="form-control">
                <span className="label-text text-xs mb-1">Plan</span>
                <select className="select select-bordered select-sm" defaultValue={editing.plan?.id ?? ""}
                  onChange={(e) => updateTenant({ planId: e.target.value || null })}>
                  <option value="">— Unassigned —</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (${p.monthlyPrice}/mo)</option>
                  ))}
                </select>
                <span className="text-xs text-base-content/60 mt-1">
                  Assigning a plan auto-syncs user/warehouse/product limits.
                </span>
              </label>

              <label className="form-control">
                <span className="label-text text-xs mb-1">Subscription Status</span>
                <select className="select select-bordered select-sm" defaultValue={editing.subscriptionStatus}
                  onChange={(e) => updateTenant({ subscriptionStatus: e.target.value })}>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="CANCELED">Canceled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </label>

              <label className="form-control">
                <span className="label-text text-xs mb-1">Trial Ends At</span>
                <input type="date" className="input input-bordered input-sm"
                  defaultValue={editing.trialEndsAt?.slice(0, 10) ?? ""}
                  onChange={(e) => updateTenant({ trialEndsAt: e.target.value || null })} />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Max Users</span>
                  <input type="number" min={1} className="input input-bordered input-sm"
                    defaultValue={editing.maxUsers}
                    onBlur={(e) => updateTenant({ maxUsers: parseInt(e.target.value) || 1 })} />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Max Warehouses</span>
                  <input type="number" min={1} className="input input-bordered input-sm"
                    defaultValue={editing.maxWarehouses}
                    onBlur={(e) => updateTenant({ maxWarehouses: parseInt(e.target.value) || 1 })} />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Max Products</span>
                  <input type="number" min={1} className="input input-bordered input-sm"
                    defaultValue={editing.maxProducts}
                    onBlur={(e) => updateTenant({ maxProducts: parseInt(e.target.value) || 1 })} />
                </label>
              </div>

              <label className="cursor-pointer flex items-center gap-2">
                <input type="checkbox" className="checkbox" defaultChecked={editing.isActive}
                  onChange={(e) => updateTenant({ isActive: e.target.checked })} />
                <span>Account active (uncheck to suspend tenant fully)</span>
              </label>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
