"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Subscription {
  planName: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  daysLeft: number | null;
  expired: boolean;
  allowed: boolean;
  reason: string | null;
  usage: {
    users: { current: number; max: number };
    warehouses: { current: number; max: number };
    products: { current: number; max: number };
  };
}

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
}

const STATUS_BADGE: Record<string, string> = {
  TRIAL: "badge-info",
  ACTIVE: "badge-success",
  PAST_DUE: "badge-warning",
  CANCELED: "badge-error",
  EXPIRED: "badge-error",
};

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min(100, (current / max) * 100);
  const danger = pct >= 90;
  const warning = pct >= 70;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono">{current} / {max}</span>
      </div>
      <progress
        className={`progress w-full ${danger ? "progress-error" : warning ? "progress-warning" : "progress-primary"}`}
        value={current}
        max={max}
      />
    </div>
  );
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/me/subscription").then((r) => r.json()),
      fetch("/api/v1/plans").then((r) => r.json()),
    ]).then(([s, p]) => {
      setSub(s);
      setPlans(p.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!sub) return <div className="p-8 text-center text-error">Failed to load subscription info.</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Billing & Plan</h1>
        <p className="text-sm text-base-content/60">Current subscription and usage.</p>
      </div>

      {/* Current Subscription */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-base-content/60">Current Plan</div>
              <div className="text-2xl font-bold">{sub.planName ?? "Trial / Unassigned"}</div>
            </div>
            <span className={`badge badge-lg ${STATUS_BADGE[sub.subscriptionStatus] ?? ""}`}>
              {sub.subscriptionStatus}
            </span>
          </div>

          {sub.subscriptionStatus === "TRIAL" && sub.trialEndsAt && (
            <div className={`alert mt-4 ${sub.daysLeft && sub.daysLeft <= 7 ? "alert-warning" : "alert-info"}`}>
              <span>
                Trial ends <strong>{format(new Date(sub.trialEndsAt), "dd MMMM yyyy")}</strong>
                {sub.daysLeft !== null && ` — ${sub.daysLeft} day${sub.daysLeft === 1 ? "" : "s"} remaining`}
              </span>
            </div>
          )}

          {sub.expired && (
            <div className="alert alert-error mt-4">
              <span><strong>{sub.reason ?? "Subscription expired"}</strong> — read-only mode active.</span>
            </div>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Usage</h2>
          <div className="space-y-4">
            <UsageBar label="Users" current={sub.usage.users.current} max={sub.usage.users.max} />
            <UsageBar label="Warehouses" current={sub.usage.warehouses.current} max={sub.usage.warehouses.max} />
            <UsageBar label="Products" current={sub.usage.products.current} max={sub.usage.products.max} />
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold mb-3">Available Plans</h2>
        <p className="text-sm text-base-content/60 mb-4">
          To upgrade or change plans, contact support — payment integration coming soon.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`card bg-base-100 shadow-sm border ${sub.planName === p.name ? "border-primary border-2" : "border-base-200"}`}>
              <div className="card-body">
                <h3 className="card-title">{p.name}</h3>
                {p.description && <p className="text-sm text-base-content/60">{p.description}</p>}
                <div className="my-3">
                  <div className="text-3xl font-bold">${p.monthlyPrice.toFixed(2)}<span className="text-sm font-normal text-base-content/60">/mo</span></div>
                  {p.yearlyPrice > 0 && (
                    <div className="text-xs text-base-content/60">${p.yearlyPrice.toFixed(2)}/yr</div>
                  )}
                </div>
                <ul className="text-sm space-y-1">
                  <li>✓ {p.maxUsers} users</li>
                  <li>✓ {p.maxWarehouses} warehouse{p.maxWarehouses === 1 ? "" : "s"}</li>
                  <li>✓ {p.maxProducts.toLocaleString()} products</li>
                </ul>
                <div className="card-actions mt-4">
                  {sub.planName === p.name ? (
                    <button className="btn btn-disabled btn-block btn-sm">Current Plan</button>
                  ) : (
                    <a href="mailto:support@nestpos.com?subject=Plan Upgrade Request" className="btn btn-primary btn-block btn-sm">
                      Request Upgrade
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-3 text-center text-base-content/50 py-8">
              No plans available. Contact support.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
