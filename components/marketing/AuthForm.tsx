"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account, appwriteConfigured, ID, isAdminEmail } from "../../lib/appwrite";
import { notifyAuthChanged, useAuth } from "../providers/AuthProvider";

type AuthFormProps = {
  mode: "login" | "register";
  title: string;
  subtitle: string;
  alternateHref: string;
  alternateLabel: string;
};

export default function AuthForm({
  mode,
  title,
  subtitle,
  alternateHref,
  alternateLabel,
}: AuthFormProps) {
  const router = useRouter();
  const { refresh, isAuthenticated, isAdmin } = useAuth();
  const [assistantName, setAssistantName] = useState("Nexa");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    async function init() {
      if (!appwriteConfigured) {
        setAuthError("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local.");
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/ui-config");
        if (response.ok) {
          const data = await response.json();
          setAssistantName(data.assistant_name || "Nexa");
        }
      } catch {}

      if (isAuthenticated) {
        router.replace(isAdmin ? "/admin" : "/chat");
        return;
      }

      setAuthLoading(false);
    }

    init();
  }, [router, isAuthenticated, isAdmin]);

  async function handleAuthSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!appwriteConfigured || authSubmitting) {
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");

    try {
      if (mode === "register") {
        await account.create(ID.unique(), authForm.email, authForm.password, authForm.name);
      }

      await account.createEmailPasswordSession(authForm.email, authForm.password);
      await refresh();
      notifyAuthChanged();
      const user = await account.get();
      router.replace(isAdminEmail(user.email) ? "/admin" : "/chat");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setAuthError(message);
    } finally {
      setAuthSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-panel p-8 shadow-soft">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{assistantName}</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === "register" ? (
            <input
              type="text"
              value={authForm.name}
              onChange={(event) =>
                setAuthForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Name"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              required
            />
          ) : null}

          <input
            type="email"
            value={authForm.email}
            onChange={(event) =>
              setAuthForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
            required
          />

          <input
            type="password"
            value={authForm.password}
            onChange={(event) =>
              setAuthForm((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Password"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
            required
          />

          {mode === "login" ? (
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-muted underline underline-offset-4">
                Forgot password?
              </Link>
            </div>
          ) : null}

          {authError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {authError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={authSubmitting || authLoading || !appwriteConfigured}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authSubmitting ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <Link href={alternateHref} className="mt-5 inline-block text-sm text-muted underline underline-offset-4">
          {alternateLabel}
        </Link>
      </div>
    </main>
  );
}
