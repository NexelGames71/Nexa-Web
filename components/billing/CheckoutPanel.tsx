"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { account, createSessionJwt } from "../../lib/nexa-identity";
import { BILLING_PLANS, getBillingPlan, getPlanLimitHighlights } from "../../lib/billing-plans";
import PromotionSpotlight from "../promotions/PromotionSpotlight";
import PayPalSubscribeButton from "./PayPalSubscribeButton";

type CheckoutPanelProps = {
  planKey: string;
};

function moneyLabel(plan: any) {
  return `${plan.price}${plan.period ? ` ${plan.period}` : ""}`;
}

export default function CheckoutPanel({ planKey }: CheckoutPanelProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState("starter");
  const [billingError, setBillingError] = useState("");
  const selectedPlan = getBillingPlan(planKey);
  const plan = selectedPlan?.paypalEnabled ? selectedPlan : getBillingPlan("plus");
  const nextPath = `/checkout?plan=${plan?.id || "plus"}`;
  const isCurrentPlan = Boolean(isSignedIn && plan && currentPlanId === plan.id);
  const paidPlans = BILLING_PLANS.filter((candidate) => candidate.paypalEnabled);
  const changeablePlans = paidPlans.filter((candidate) => candidate.id !== currentPlanId);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        await account.get();
        const jwt = await createSessionJwt();
        const response = await fetch("/api/billing/me", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
          cache: "no-store",
        });
        const billingProfile = await response.json().catch(() => ({}));
        if (!cancelled) {
          setIsSignedIn(true);
          if (response.ok) {
            setCurrentPlanId(billingProfile.plan || "starter");
            setBillingError("");
          } else {
            setBillingError(billingProfile.error || "Could not load your current plan.");
          }
        }
      } catch {
        if (!cancelled) {
          setIsSignedIn(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!plan) {
    return null;
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-5 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)]">
      <section className="rounded-2xl border border-line bg-panel p-6 shadow-soft">
        <p className="text-sm font-medium text-muted">Checkout</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{plan.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{plan.description}</p>

        <div className="mt-8 flex items-end gap-2">
          <span className="text-5xl font-semibold text-ink">{plan.price}</span>
          <span className="pb-2 text-sm text-muted">{plan.period}</span>
        </div>

        <ul className="mt-8 grid gap-3 text-sm text-ink sm:grid-cols-2">
          {[...plan.features, ...getPlanLimitHighlights(plan)].map((feature: string) => (
            <li key={feature} className="flex gap-2 rounded-xl border border-line bg-shell px-3 py-2">
              <span aria-hidden>✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <PromotionSpotlight surface="checkout" planKey={plan.id} className="mt-8" />

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          {paidPlans.map((candidate) => {
            const candidateIsCurrentPlan = isSignedIn && candidate.id === currentPlanId;
            const candidateIsSelectedPlan = candidate.id === plan.id;

            if (candidateIsCurrentPlan) {
              return (
                <span
                  key={candidate.id}
                  className="rounded-full border border-ink bg-ink px-4 py-2 text-white"
                >
                  {candidate.name} - Current plan
                </span>
              );
            }

            return (
              <Link
                key={candidate.id}
                href={`/checkout?plan=${candidate.id}`}
                className={`rounded-full border px-4 py-2 transition ${
                  candidateIsSelectedPlan
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
              >
                {candidate.name}
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="rounded-2xl border border-line bg-shell p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Order summary</h2>
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Plan</span>
            <span className="font-medium text-ink">{plan.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Billing</span>
            <span className="font-medium text-ink">{moneyLabel(plan)}</span>
          </div>
          {plan.billingType === "per_seat" ? (
            <p className="rounded-xl border border-line bg-white p-3 text-xs leading-5 text-muted">
              Business is billed per seat. Seat quantity is managed in Nexa after subscription setup.
            </p>
          ) : null}
        </div>

        <div className="mt-6 border-t border-line pt-6">
          {checkingSession ? (
            <p className="text-sm text-muted">Checking your Nexa session...</p>
          ) : billingError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-600">
              {billingError}
            </div>
          ) : isCurrentPlan ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-white p-4">
                <div className="text-sm font-medium text-ink">You already have this plan.</div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choose a different plan to change your subscription.
                </p>
              </div>
              <div className="grid gap-2">
                {changeablePlans.map((candidate) => (
                  <Link
                    key={candidate.id}
                    href={`/checkout?plan=${candidate.id}`}
                    className="block rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Change to {candidate.name.replace(/^Nexa\s+/i, "")}
                  </Link>
                ))}
              </div>
            </div>
          ) : isSignedIn ? (
            <PayPalSubscribeButton planKey={plan.id} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted">
                Sign in or create a Nexa account before opening PayPal checkout.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="block rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
              >
                Sign in to continue
              </Link>
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="block rounded-full border border-line bg-white px-4 py-3 text-center text-sm font-medium text-ink transition hover:border-ink"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
