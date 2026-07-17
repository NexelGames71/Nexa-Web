"use client";

import { useState } from "react";

import { createSessionJwt } from "../../lib/nexa-identity";

type PayPalSubscribeButtonProps = {
  planKey?: string;
};

export default function PayPalSubscribeButton({ planKey = "plus" }: PayPalSubscribeButtonProps) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function startCheckout() {
    setPending(true);
    setError("");
    setStatus("Opening secure checkout...");
    try {
      const jwt = await createSessionJwt();
      const response = await fetch("/api/billing/paypal/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ planKey }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to create checkout.");
      }
      window.location.assign(data.url);
    } catch (checkoutError: any) {
      setError(checkoutError?.message || "Checkout failed.");
      setStatus("");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Opening checkout..." : "Continue to secure checkout"}
      </button>
      {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
