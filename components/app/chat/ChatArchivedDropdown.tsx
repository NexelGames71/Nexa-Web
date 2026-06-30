// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import ChatConversationItem from "./ChatConversationItem";
import { IconChevronDown } from "./ChatIcons";

export default function ChatArchivedDropdown({
  open,
  onToggle,
  archivedConversations,
  activeConversationId,
  sidebarOpen,
  onOpenConversation,
  onShare,
  onRename,
  onPin,
  onUnarchive,
  onDelete,
}) {
  const rootRef = useRef(null);
  const count = archivedConversations.length;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        onToggle(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onToggle(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onToggle]);

  if (!sidebarOpen) {
    return (
      <div className="flex justify-center px-1 pb-1">
        <button
          type="button"
          onClick={() => onToggle(!open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-chat-hover"
          aria-label={count ? `Archived chats (${count})` : "Archived chats"}
          title={count ? `Archived (${count})` : "Archived"}
        >
          <span className="text-sm opacity-80">📦</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="px-2 pb-1">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-chat-hover"
        aria-expanded={open}
        aria-controls="archived-chats-panel"
      >
        <span className="text-base leading-none opacity-70">📦</span>
        <span className="flex-1 text-left font-medium">Archived</span>
        {count > 0 ? (
          <span className="rounded-full bg-chat-hover px-2 py-0.5 text-[11px] text-chat-muted">{count}</span>
        ) : null}
        <IconChevronDown
          className={["h-4 w-4 text-chat-muted transition", open ? "rotate-180" : ""].join(" ")}
        />
      </button>

      {open ? (
        <div
          id="archived-chats-panel"
          className="chat-scroll mt-1 max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-chat-border bg-chat-surface/80 p-1"
        >
          {count === 0 ? (
            <p className="px-3 py-3 text-xs text-chat-muted">No archived chats yet.</p>
          ) : (
            archivedConversations.map((conversation) => (
              <ChatConversationItem
                key={conversation.id}
                conversation={conversation}
                active={activeConversationId === conversation.id}
                isPinned={false}
                isArchived
                onOpen={() => onOpenConversation(conversation.id)}
                onShare={() => onShare(conversation.id)}
                onRename={() => onRename(conversation)}
                onPin={() => onPin(conversation.id)}
                onUnarchive={() => onUnarchive(conversation.id)}
                onDelete={() => onDelete(conversation.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
