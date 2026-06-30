// @ts-nocheck
"use client";

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Help me write a professional email",
  "Debug my Python code",
  "Plan a weekend trip",
];

export default function ChatEmptyState({ assistantName, onSuggestionClick }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6">
      <h1 className="mb-8 text-center text-2xl font-medium text-ink md:text-[28px]">
        What can I help with?
      </h1>
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onSuggestionClick(label)}
            className="rounded-xl border border-chat-border bg-chat-surface px-4 py-3 text-left text-sm text-ink transition hover:bg-chat-hover"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-chat-muted">{assistantName} - your AI assistant from Nexa Labs</p>
    </div>
  );
}
