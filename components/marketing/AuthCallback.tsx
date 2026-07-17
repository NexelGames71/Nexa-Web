"use client";

import { useEffect, useState } from "react";
import { setIdentityTokens } from "../../lib/nexa-identity";

export default function AuthCallback() {
  const [message, setMessage] = useState("Completing secure sign in...");

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        if (!code || !state) {
          throw new Error("The Nexa Identity callback is missing required data.");
        }

        const response = await fetch("/api/auth/exchange-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ code, state }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok === false) {
          throw new Error(payload?.error?.message || "Could not complete sign in.");
        }

        const data = payload.data;
        setIdentityTokens(data.tokens);
        window.dispatchEvent(new Event("nexa-auth-changed"));
        window.location.replace(data.returnTo || "/chat");
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Could not complete sign in.");
        }
      }
    }

    void complete();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-5">
      <section className="w-full max-w-md rounded-[28px] border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Nexa Identity</p>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Signing you in</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{message}</p>
      </section>
    </main>
  );
}
