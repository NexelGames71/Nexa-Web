// @ts-nocheck
"use client";

import ChatConversationMenu from "./ChatConversationMenu";

export default function ChatConversationItem({
  conversation,
  active,
  isPinned,
  isArchived = false,
  onOpen,
  onShare,
  onRename,
  onPin,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  return (
    <div
      className={[
        "group relative flex w-full items-center gap-1 rounded-[10px] pr-1 transition hover:bg-chat-hover",
        active ? "bg-chat-hover" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onOpen?.()}
        className={[
          "min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm",
          active ? "font-medium text-ink" : "text-ink",
          isPinned && !active ? "text-ink" : "",
        ].join(" ")}
      >
        {isPinned ? <span className="mr-1 text-xs opacity-60">📌</span> : null}
        {conversation.title}
      </button>

      <ChatConversationMenu
        conversation={conversation}
        isPinned={isPinned}
        isArchived={isArchived}
        onShare={onShare}
        onRename={onRename}
        onPin={onPin}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onDelete={onDelete}
      />
    </div>
  );
}
