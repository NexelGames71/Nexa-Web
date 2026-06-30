import Link from "next/link";
import AppShell from "../../components/marketing/AppShell";
import { EXPLORE_ASSISTANTS } from "../../lib/site-content";

export default function ExplorePage() {
  return (
    <AppShell
      title="Explore assistants"
      subtitle="Preset Nexa assistants — or build your own."
    >
      <div className="grid gap-5 px-5 py-10 md:grid-cols-2">
        {EXPLORE_ASSISTANTS.map((assistant) => (
          <Link
            key={assistant.slug}
            href={`/chat?assistant=${assistant.slug}`}
            className="rounded-3xl border border-line bg-panel p-6 shadow-soft transition hover:border-ink/30"
          >
            <h2 className="font-semibold">{assistant.name}</h2>
            <p className="mt-2 text-sm text-muted">{assistant.description}</p>
          </Link>
        ))}
        <Link
          href="/create"
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/60 p-6 text-center"
        >
          <span className="text-2xl">+</span>
          <span className="mt-2 font-semibold">Create Assistant</span>
        </Link>
      </div>
    </AppShell>
  );
}
