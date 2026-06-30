// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";

function MenuIcon({ children }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[15px] text-chat-muted">
      {children}
    </span>
  );
}

export default function ChatConversationMenu({
  conversation,
  isPinned = false,
  isArchived = false,
  onShare,
  onRename,
  onPin,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const items = [
    {
      id: "share",
      label: "Share",
      icon: "↗",
      onClick: () => {
        onShare?.();
        setOpen(false);
      },
    },
    {
      id: "group",
      label: "Start a group chat",
      icon: "👥",
      disabled: true,
      onClick: () => {},
    },
    {
      id: "rename",
      label: "Rename",
      icon: "✎",
      onClick: () => {
        onRename?.();
        setOpen(false);
      },
    },
    {
      id: "project",
      label: "Move to project",
      icon: "▣",
      disabled: true,
      onClick: () => {},
    },
    { id: "divider" },
    {
      id: "pin",
      label: isPinned ? "Unpin chat" : "Pin chat",
      icon: "📌",
      onClick: () => {
        onPin?.();
        setOpen(false);
      },
    },
    isArchived
      ? {
          id: "unarchive",
          label: "Unarchive",
          icon: "▣",
          onClick: () => {
            onUnarchive?.();
            setOpen(false);
          },
        }
      : {
          id: "archive",
          label: "Archive",
          icon: "▣",
          onClick: () => {
            onArchive?.();
            setOpen(false);
          },
        },
    {
      id: "delete",
      label: "Delete",
      icon: "🗑",
      danger: true,
      onClick: () => {
        onDelete?.();
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={[
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-chat-muted transition hover:bg-chat-surface hover:text-ink",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
        aria-label={`Chat options for ${conversation.title}`}
        aria-expanded={open}
      >
        <span className="text-base leading-none">⋯</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-chat-border bg-chat-surface py-1.5 shadow-chat-popover"
          onClick={(event) => event.stopPropagation()}
        >
          {items.map((item) => {
            if (item.id === "divider") {
              return <div key={item.id} className="my-1.5 border-t border-chat-border" />;
            }

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!item.disabled) {
                    item.onClick();
                  }
                }}
                className={[
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition",
                  item.disabled
                    ? "cursor-not-allowed text-chat-muted/60"
                    : item.danger
                      ? "text-red-600 hover:bg-red-50"
                      : "text-ink hover:bg-chat-hover",
                ].join(" ")}
              >
                <MenuIcon>{item.icon}</MenuIcon>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
