"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createSessionJwt } from "../../lib/nexa-identity";
import { getBillingPlan } from "../../lib/billing-plans";

type CheckoutSuccessPanelProps = {
  planKey: string;
  subscriptionId?: string;
};

export default function CheckoutSuccessPanel({ planKey, subscriptionId = "" }: CheckoutSuccessPanelProps) {
  const plan = getBillingPlan(planKey) || getBillingPlan("plus");
  const [billingPlanName, setBillingPlanName] = useState(plan?.name || "Nexa plan");

  useEffect(() => {
    let cancelled = false;

    async function loadBilling() {
      try {
        const jwt = await createSessionJwt();
        const response = await fetch("/api/billing/me", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
          cache: "no-store",
        });
        const data = await response.json();
        if (!cancelled && response.ok && data.planName) {
          setBillingPlanName(data.planName);
        }
      } catch {}
    }

    void loadBilling();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-5 py-12">
      <section className="w-full rounded-2xl border border-line bg-panel p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-white">
          ✓
        </div>
        <p className="mt-6 text-sm font-medium text-muted">Subscription confirmed</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{billingPlanName} is active</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
          Your Nexa account has been updated. The plan badge and billing benefits are now attached to your account.
        </p>

        {subscriptionId ? (
          <p className="mt-5 rounded-xl border border-line bg-shell px-4 py-3 text-xs text-muted">
            PayPal subscription: {subscriptionId}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/chat"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open Nexa
          </Link>
          <Link
            href="/settings/billing"
            className="rounded-full border border-line bg-white px-5 py-3 text-sm font-medium text-ink transition hover:border-ink"
          >
            View billing
          </Link>
        </div>
      </section>
    </main>
  );
}
