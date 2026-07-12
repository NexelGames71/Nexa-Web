"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { BRAND } from "../../lib/site-content";

const APP_LINKS = [
  { href: "/chat", label: "Chat" },
  { href: "/explore", label: "Explore" },
  { href: "/memory", label: "Memory" },
  { href: "/library", label: "Library" },
  { href: "/settings/profile", label: "Settings" },
];

export default function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const chatHref = isAdmin ? "/admin" : "/chat";

  return (
    <div className="min-h-screen bg-shell text-ink">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-shell/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/chat" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/nexa-logo.png" alt="" className="h-8 w-8 object-contain" />
            {BRAND.name}
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {APP_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "text-sm transition",
                    active ? "font-medium text-ink" : "text-muted hover:text-ink",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {!loading && isAuthenticated ? (
            <Link
              href={chatHref}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Open Nexa
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-full border border-line bg-panel px-4 py-2 text-sm text-muted transition hover:text-ink"
            >
              Home
            </Link>
          )}
        </div>
      </header>

      {title ? (
        <div className="border-b border-line bg-gradient-to-b from-white to-shell px-5 py-10">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
