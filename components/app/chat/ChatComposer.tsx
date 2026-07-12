// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { THINKING_MODES } from "../../../lib/thinking-modes";
import { IconSend } from "./ChatIcons";

const thinkingIcon = { src: "/thinking.png" };
const PLUS_MENU_ITEMS = [
  { id: "files", label: "Add photos & files", icon: "📎", disabled: true },
  { id: "recent", label: "Recent files", icon: "🕐", disabled: true },
  {
    id: "image",
    label: "Create image",
    icon: "🖌",
    prompt: "Create an image of ",
  },
  { id: "research", label: "Deep research", icon: "🔬", disabled: true },
  {
    id: "search",
    label: "Web search",
    icon: "🌐",
    prompt: "Search the web for ",
  },
  { id: "more", label: "More", icon: "···", disabled: true, hasChevron: true },
];

export default function ChatComposer({
  prompt,
  setPrompt,
  onKeyDown,
  isSending,
  placeholder = "Ask anything",
  responseLength,
  onSelectMode,
  addMenuOpen,
  setAddMenuOpen,
  menuId,
  onQuickAction,
}) {
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const thinkingMenuId = `${menuId}-thinking`;

  const currentMode =
    THINKING_MODES.find((mode) => String(mode.value) === String(responseLength)) ||
    THINKING_MODES[0];
  const canSend = Boolean(prompt.trim()) && !isSending;

  useEffect(() => {
    if (!plusMenuOpen && addMenuOpen !== thinkingMenuId) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!event.target.closest("[data-composer-menu-root]")) {
        setPlusMenuOpen(false);
        setAddMenuOpen("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setPlusMenuOpen(false);
        setAddMenuOpen("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [plusMenuOpen, addMenuOpen, thinkingMenuId, setAddMenuOpen]);

  function handlePlusItemClick(item) {
    if (item.disabled) {
      return;
    }

    if (item.prompt) {
      setPrompt(item.prompt);
      onQuickAction?.(item.prompt);
    }

    setPlusMenuOpen(false);
  }

  function openThinkingMenu() {
    setPlusMenuOpen(false);
    setAddMenuOpen((current) => (current === thinkingMenuId ? "" : thinkingMenuId));
  }

  function openPlusMenu() {
    setAddMenuOpen("");
    setPlusMenuOpen((current) => !current);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        data-composer-menu-root
        className="relative rounded-[26px] border border-chat-border bg-chat-surface shadow-chat-composer transition focus-within:border-chat-border-strong"
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          className="max-h-[200px] min-h-[52px] w-full resize-none rounded-[26px] bg-transparent px-4 pb-12 pl-12 pt-3.5 text-base leading-6 text-ink outline-none placeholder:text-chat-muted"
          aria-label="Message"
          placeholder={placeholder}
        />

        <div className="absolute bottom-2 left-2">
          <div className="relative">
            {plusMenuOpen ? (
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-chat-border bg-chat-surface py-1.5 shadow-chat-popover">
                {PLUS_MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handlePlusItemClick(item)}
                    className={[
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition",
                      item.disabled
                        ? "cursor-not-allowed text-chat-muted/60"
                        : "text-ink hover:bg-chat-hover",
                    ].join(" ")}
                  >
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.hasChevron ? (
                      <span className="text-chat-muted" aria-hidden>
                        ›
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={openPlusMenu}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-chat-muted transition hover:bg-chat-hover hover:text-ink"
              aria-label="Add attachments and more"
              aria-expanded={plusMenuOpen}
            >
              +
            </button>
          </div>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center justify-end gap-2">
          <div className="relative">
            {addMenuOpen === thinkingMenuId ? (
              <div className="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-chat-border bg-chat-surface p-1.5 shadow-chat-popover">
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
                        selected ? "bg-chat-hover font-medium text-ink" : "text-ink hover:bg-chat-hover",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          selected ? "bg-ink" : "bg-chat-border",
                        ].join(" ")}
                      />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              onClick={openThinkingMenu}
              className="inline-flex items-center gap-1.5 rounded-full border border-chat-border px-2.5 py-1.5 text-xs text-ink transition hover:bg-chat-hover"
              aria-expanded={addMenuOpen === thinkingMenuId}
              aria-label="Thinking mode"
            >
              <img src={thinkingIcon.src} alt="" className="h-3.5 w-3.5 opacity-70" />
              <span>{currentMode.label}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <IconSend className="h-7 w-7" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-chat-muted">
        Nexa can make mistakes. Check important info.
      </p>
    </div>
  );
}
