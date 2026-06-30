"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { account, appwriteConfigured } from "../../lib/appwrite";
import { BRAND } from "../../lib/site-content";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", match: (path: string) => path === "/admin" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/support", label: "Support" },
];

function isActive(pathname: string, href: string, match?: (path: string) => boolean) {
  if (match) {
    return match(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (!appwriteConfigured) {
      return;
    }
    account
      .get()
      .then((current) => setUser({ name: current.name, email: current.email }))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-shell text-ink">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-panel lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center gap-3 border-b border-line px-5 lg:h-[4.25rem]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-white">
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
                  className={[
                    "whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm transition",
                    active
                      ? "bg-ink font-medium text-white"
                      : "text-muted hover:bg-sidebar hover:text-ink",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

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

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
