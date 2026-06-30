// @ts-nocheck
"use client";

import { THINKING_MODES } from "../../../lib/thinking-modes";
import { IconChevronDown, IconSidebar } from "./ChatIcons";

export default function ChatTopBar({
  assistantName,
  responseLength,
  onSelectMode,
  addMenuOpen,
  setAddMenuOpen,
  onOpenSidebar,
}) {
  const currentMode =
    THINKING_MODES.find((mode) => String(mode.value) === String(responseLength)) ||
    THINKING_MODES[0];

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-chat-border bg-chat-surface/80 px-3 backdrop-blur-md md:justify-center md:px-4">
      {onOpenSidebar ? (
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-chat-hover md:hidden"
          aria-label="Open sidebar"
        >
          <IconSidebar className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 md:hidden" />
      )}
      <div data-add-menu-root className="relative">
        {addMenuOpen === "topbar-model" ? (
          <div className="absolute left-1/2 top-full z-30 mt-1 w-48 -translate-x-1/2 rounded-xl border border-chat-border bg-chat-surface p-1.5 shadow-chat-popover">
            {THINKING_MODES.map((mode) => {
              const selected = String(responseLength) === String(mode.value);
              return (
                <button
                  key={String(mode.value)}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode.value);
                    setAddMenuOpen("");
                  }}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                    selected ? "bg-chat-hover font-medium" : "hover:bg-chat-hover",
                  ].join(" ")}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() =>
            setAddMenuOpen((current) => (current === "topbar-model" ? "" : "topbar-model"))
          }
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-ink transition hover:bg-chat-hover"
          aria-expanded={addMenuOpen === "topbar-model"}
        >
          <span>{currentMode.label}</span>
          <IconChevronDown />
        </button>
      </div>
      <span className="w-9 md:hidden" aria-hidden />
      <span className="sr-only">{assistantName}</span>
    </header>
  );
}
