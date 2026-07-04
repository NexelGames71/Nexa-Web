"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { createSessionJwt } from "../../lib/appwrite";
import { notifyAuthChanged } from "../providers/AuthProvider";

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_SCRIPT_ID = "paypal-subscription-sdk";

function loadPayPalSdk(clientId: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null;
    if (window.paypal?.Buttons) {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load PayPal.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = PAYPAL_SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
    script.async = true;
    script.dataset.sdkIntegrationSource = "nexa-web";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load PayPal.")), {
      once: true,
    });
    document.body.appendChild(script);
  });
}

type PayPalSubscribeButtonProps = {
  planKey?: string;
};

export default function PayPalSubscribeButton({ planKey = "plus" }: PayPalSubscribeButtonProps) {
  const router = useRouter();
  const containerId = useId().replace(/:/g, "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  useEffect(() => {
    let cancelled = false;
    let buttons: any = null;

    async function renderButton() {
      setError("");
      if (!clientId) {
        setError("PayPal checkout is not configured.");
        return;
      }
      try {
        await loadPayPalSdk(clientId);
        if (cancelled || !window.paypal?.Buttons) {
          return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
          return;
        }
        container.innerHTML = "";

        buttons = window.paypal.Buttons({
          style: {
            shape: "pill",
            color: "silver",
            layout: "vertical",
            label: "subscribe",
          },
          createSubscription: async () => {
            setStatus("Opening PayPal checkout...");
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
            if (!response.ok || !data.id) {
              throw new Error(data.error || "Failed to create PayPal subscription.");
            }
            return data.id;
          },
          onApprove: async (data: any) => {
            setError("");
            setStatus("Confirming your subscription...");
            const jwt = await createSessionJwt();
            const response = await fetch("/api/billing/paypal/confirm", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwt}`,
              },
              body: JSON.stringify({
                subscriptionId: data.subscriptionID,
                planKey,
              }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(result.error || "Subscription was approved, but Nexa could not confirm it yet.");
            }
            notifyAuthChanged();
            router.push(
              `/checkout/success?plan=${encodeURIComponent(planKey)}&subscription=${encodeURIComponent(data.subscriptionID || "")}`,
            );
          },
          onCancel: () => {
            setStatus("Subscription checkout was cancelled.");
          },
          onError: (paypalError: any) => {
            setError(paypalError?.message || "PayPal checkout failed.");
            setStatus("");
          },
        });
        buttons.render(`#${containerId}`);
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Failed to load PayPal checkout.");
        }
      }
    }

    void renderButton();

    return () => {
      cancelled = true;
      try {
        buttons?.close?.();
      } catch {}
    };
  }, [clientId, containerId, planKey, router]);

  return (
    <div>
      <div id={containerId} />
      {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
