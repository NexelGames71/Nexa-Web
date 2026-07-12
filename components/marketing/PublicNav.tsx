"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { BRAND, NAV_LINKS } from "../../lib/site-content";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { user, loading, isAuthenticated, isAdmin, signOut } = useAuth();

  const chatHref = isAdmin ? "/admin" : "/chat";
  const initial = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();
  const planLabel = user?.planName && user.planName !== "Starter" ? user.planName : "";

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-shell/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <img src="/nexa-logo.png" alt="" className="h-8 w-8 object-contain" />
          {BRAND.name}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <span className="text-sm text-muted">...</span>
          ) : isAuthenticated ? (
            <>
              <Link
                href={chatHref}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open Nexa
              </Link>
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 rounded-full border border-line bg-panel py-1.5 pl-1.5 pr-3 text-sm transition hover:border-ink/20"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {initial}
                </span>
                <span className="max-w-[120px] truncate text-ink">
                  {user?.name || user?.email?.split("@")[0]}
                </span>
                {planLabel ? (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    {planLabel.replace(/^Nexa\s+/i, "")}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-sm text-muted transition hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted transition hover:text-ink">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg border border-line px-3 py-2 text-sm md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-panel px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href={chatHref} className="text-sm font-medium text-ink" onClick={() => setOpen(false)}>
                  Open Nexa
                </Link>
                <Link
                  href="/settings/profile"
                  className="text-sm text-muted"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="text-left text-sm text-muted"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-ink px-4 py-2 text-center text-sm font-medium text-white"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
