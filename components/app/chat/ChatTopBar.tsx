// @ts-nocheck
"use client";

import Link from "next/link";
import { IconSidebar } from "./ChatIcons";

export default function ChatTopBar({
  assistantName,
  onOpenSidebar,
  adminHref,
  showAdminDashboard,
}) {
  return (
    <header className="sticky top-0 z-20 grid h-12 shrink-0 grid-cols-[auto_1fr_auto] items-center border-b border-chat-border bg-chat-surface px-3 md:hidden">
      {onOpenSidebar ? (
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-chat-hover md:hidden"
          aria-label="Open sidebar"
        >
          <IconSidebar className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 md:hidden" />
      )}
      <div className="justify-self-center" aria-hidden />
      <div className="flex items-center justify-end gap-2">
        {showAdminDashboard ? (
          <Link
            href={adminHref || "/admin"}
            className="hidden rounded-[10px] border border-chat-border bg-chat-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-chat-hover sm:inline-flex"
          >
            Admin Dashboard
          </Link>
        ) : null}
        <span className="w-9 md:hidden" aria-hidden />
      </div>
      <span className="sr-only">{assistantName}</span>
    </header>
  );
}
