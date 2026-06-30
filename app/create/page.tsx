import Link from "next/link";
import AppShell from "../../components/marketing/AppShell";
import { EXPLORE_ASSISTANTS } from "../../lib/site-content";

export default function CreateAssistantPage() {
  return (
    <AppShell
      title="Create a Nexa assistant"
      subtitle="Define instructions, tone, and tools for a custom assistant you can open from Explore or chat."
    >
      <div className="grid gap-8 px-5 py-10 pb-16 lg:grid-cols-[1fr_320px]">
        <form className="space-y-4 rounded-3xl border border-line bg-panel p-8 shadow-soft">
          <label className="block text-sm font-medium text-ink">
            Assistant name
            <input
              type="text"
              placeholder="e.g. Product research"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-ink/30"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Instructions
            <textarea
              placeholder="Describe how this assistant should behave, what to avoid, and which sources to prefer."
              rows={8}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-ink/30"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Starter prompt (optional)
            <input
              type="text"
              placeholder="First message shown when the assistant opens"
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-ink/30"
            />
          </label>
          <p className="text-xs leading-5 text-muted">
            Custom assistants are saved to your account and appear in Explore. Full save and share
            flows ship in the next release — use a preset below to start chatting today.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Browse presets
            </Link>
            <Link
              href="/chat"
              className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:bg-black/[0.03]"
            >
              Open Nexa Chat
            </Link>
          </div>
        </form>

        <aside className="rounded-3xl border border-line bg-white/60 p-6">
          <h2 className="text-sm font-semibold text-ink">Popular starting points</h2>
          <ul className="mt-4 space-y-3">
            {EXPLORE_ASSISTANTS.map((assistant) => (
              <li key={assistant.slug}>
                <Link
                  href={`/chat?assistant=${assistant.slug}`}
                  className="block rounded-2xl border border-line bg-panel px-4 py-3 text-sm transition hover:border-ink/30"
                >
                  <span className="font-medium text-ink">{assistant.name}</span>
                  <span className="mt-1 block text-xs text-muted">{assistant.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
