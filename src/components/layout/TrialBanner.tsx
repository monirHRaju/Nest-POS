"use client";

import { useEffect, useState } from "react";

interface SubscriptionInfo {
  planName: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  daysLeft: number | null;
  expired: boolean;
  allowed: boolean;
  reason: string | null;
}

export function TrialBanner() {
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/v1/me/subscription")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  if (!info || dismissed) return null;

  // Expired or blocked: red, non-dismissible
  if (info.expired || !info.allowed) {
    return (
      <div className="alert alert-error rounded-none border-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          <strong>{info.reason ?? "Subscription inactive"}</strong> — read-only mode active. Contact support or upgrade.
        </span>
      </div>
    );
  }

  // Trial ending soon: warning yellow, dismissible
  if (info.subscriptionStatus === "TRIAL" && info.daysLeft !== null && info.daysLeft <= 7) {
    return (
      <div className="alert alert-warning rounded-none border-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Trial ends in <strong>{info.daysLeft} day{info.daysLeft === 1 ? "" : "s"}</strong>.
          {" "}<a href="/settings/billing" className="underline">View plan options</a>
        </span>
        <button onClick={() => setDismissed(true)} className="btn btn-sm btn-ghost">✕</button>
      </div>
    );
  }

  return null;
}
