"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { account, appwriteConfigured, isAdminEmail } from "../../lib/appwrite";
import { BRAND } from "../../lib/site-content";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "overview", match: (path: string) => path === "/admin" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/models", label: "Models", icon: "models" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
  { href: "/admin/billing", label: "Billing", icon: "billing" },
  { href: "/admin/support", label: "Support", icon: "support" },
  { href: "/admin/training", label: "Training", icon: "training" },
];

function isActive(pathname: string, href: string, match?: (path: string) => boolean) {
  if (match) {
    return match(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "users":
      return <path {...common} d="M7 18a4 4 0 0 1 8 0M11 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5 7v-.8a3 3 0 0 0-2-2.8M16 5.2a3 3 0 0 1 0 5.6" />;
    case "models":
      return <path {...common} d="M12 3 4.5 7.2v8.6L12 20l7.5-4.2V7.2L12 3Zm0 0v8.5m7.5-4.3L12 11.5 4.5 7.2" />;
    case "analytics":
      return <path {...common} d="M5 19V9m7 10V5m7 14v-7M4 19h16" />;
    case "billing":
      return <path {...common} d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Zm0 2.5h16M8 15h4" />;
    case "support":
      return <path {...common} d="M12 20a8 8 0 1 0-8-8v5l1.8-1.1A8 8 0 0 0 12 20Zm-2.5-9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 2h.01" />;
    case "training":
      return <path {...common} d="M5 5h14M7 9h10M9 13h6M4 19l4-4h8l4 4" />;
    default:
      return <path {...common} d="M4 12h6V4H4v8Zm10 8h6v-8h-6v8ZM4 20h6v-4H4v4Zm10-12h6V4h-6v4Z" />;
  }
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isKnownAdmin = !appwriteConfigured || isAdminEmail(user?.email);

  useEffect(() => {
    if (!appwriteConfigured) {
      setAuthChecked(true);
      return;
    }
    account
      .get()
      .then((current) => setUser({ name: current.name, email: current.email }))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authChecked || !appwriteConfigured || isKnownAdmin) {
      return;
    }

    router.replace(user ? "/chat" : "/login");
  }, [authChecked, isKnownAdmin, router, user]);

  if (authChecked && appwriteConfigured && !isKnownAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-shell text-ink">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-panel px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          className="rounded-xl border border-line bg-shell px-3 py-2 text-sm font-medium"
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
        >
          Menu
        </button>
        <p className="text-sm font-semibold">{BRAND.name} Admin</p>
        <Link href="/chat" className="rounded-xl border border-line px-3 py-2 text-sm font-medium">
          Chat
        </Link>
      </div>
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          id="admin-sidebar"
          className={[
            "border-b border-line bg-panel lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r",
            sidebarOpen ? "block" : "hidden lg:block",
          ].join(" ")}
        >
          <div className="flex h-16 items-center gap-3 border-b border-line px-5 lg:h-[4.25rem]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-white shadow-md">
              N
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{BRAND.name}</p>
              <p className="text-xs text-muted">Admin</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 py-4 lg:flex-col lg:overflow-visible">
            {ADMIN_NAV.map((item) => {
              const active = isActive(pathname, item.href, item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={[
                    "group inline-flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm transition",
                    active
                      ? "bg-ink font-medium text-white"
                      : "text-muted hover:bg-sidebar hover:text-ink hover:translate-x-0.5",
                  ].join(" ")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                    <NavIcon name={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mx-5 mb-5 rounded-3xl border border-line bg-shell p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="admin-pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
              Operational
            </div>
            <p className="mt-3 text-sm leading-6 text-smoke">
              Admin actions should be authenticated, permission-aware, and audit logged before mutation.
            </p>
          </div>

          <div className="hidden border-t border-line px-5 py-5 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Signed in</p>
            <p className="mt-2 text-sm font-medium">{user?.name || "Administrator"}</p>
            <p className="mt-1 break-all text-xs text-muted">{user?.email || ""}</p>
            <Link
              href="/chat"
              className="mt-4 inline-flex rounded-full border border-line bg-shell px-4 py-2 text-xs font-medium text-ink transition hover:bg-white"
            >
              Back to chat
            </Link>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
