import Link from "next/link";
import type { Metadata } from "next";

import Section from "../../../components/marketing/Section";

export const metadata: Metadata = {
  title: "Nexa AI Features",
  description:
    "Explore Nexa AI features for Ember 0.5 streaming chat, Prism 0.5 image generation, memory, search, voice direction, browser assistance, and developer APIs.",
  alternates: {
    canonical: "/features",
  },
};

const FEATURE_GROUPS = [
  {
    eyebrow: "Assistant",
    title: "Ember 0.5 streaming chat",
    body: "The core Nexa assistant is powered by Ember 0.5, the first official Nexa text model release. It is built for clear answers, writing support, planning, coding guidance, summarization, and practical decision support.",
    bullets: ["Token streaming", "Fast, Thinker, and Deep Thinker modes", "Chat history and archives", "Title generation and structured responses"],
    href: "/chat",
  },
  {
    eyebrow: "Creative",
    title: "Prism 0.5 image generation",
    body: "Prism 0.5 gives Nexa a dedicated visual model identity for generated images, concept exploration, product ideas, brand visuals, and image-library workflows.",
    bullets: ["Text-to-image creation", "Generated image library", "Prompt search", "Image reopening and inspection"],
    href: "/images",
  },
  {
    eyebrow: "Memory",
    title: "User-controlled context",
    body: "Nexa memory is designed around user control. Users can save profile context, preferences, useful facts, and project direction so the assistant can keep continuity across sessions.",
    bullets: ["Profile memory", "Preference controls", "Data export", "Archive and deletion controls"],
    href: "/settings/data",
  },
  {
    eyebrow: "Research",
    title: "Search and web grounding",
    body: "Nexa supports workspace search and web-grounded answers when fresh sources are needed. The goal is to help users move from a question to useful context faster.",
    bullets: ["Conversation search", "Workspace context", "Web source handling", "Research-ready answers"],
    href: "/search",
  },
  {
    eyebrow: "Browser",
    title: "Browser-aware workflow direction",
    body: "Nexa is not only a chatbot. The browser direction is page-aware assistance: summaries, form help, research guidance, tab context, and user-approved browser actions.",
    bullets: ["Page understanding", "Form assistance direction", "Permission-aware actions", "Workflow guidance"],
    href: "/browser",
  },
  {
    eyebrow: "Developers",
    title: "Private model API foundation",
    body: "Nexa is designed around local/private model APIs, streaming routes, usage tracking, model naming, and admin visibility for active model health.",
    bullets: ["Streaming API routes", "Model usage tracking", "Admin model dashboard", "Future OpenAI-compatible endpoints"],
    href: "/api",
  },
];

const RUNTIME_POINTS = [
  "Ember 0.5 runs through the Nexa Private Runtime for the core assistant experience.",
  "Prism 0.5 powers generated-image workflows and the image library.",
  "The runtime direction prioritizes CUDA-aware private inference and no hidden hosted fallback for private model work.",
  "Nexa modes are product-facing controls for response speed, depth, and token budget.",
];

export default function FeaturesPage() {
  return (
    <>
      <section className="border-b border-line bg-[#050505] px-5 py-14 text-white md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/64">
            Nexa feature stack
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.7fr)] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
                A private assistant workspace built around real Nexa models.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                Nexa brings chat, memory, image generation, search, browser assistance, voice direction, and developer APIs into one product surface powered by Ember 0.5 and Prism 0.5.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Active model identity</div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p><span className="font-semibold text-white">Ember 0.5</span> for text and chat.</p>
                <p><span className="font-semibold text-white">Prism 0.5</span> for image generation.</p>
                <p><span className="font-semibold text-white">Nexa Private Runtime</span> for local/private inference direction.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section
        title="Core product capabilities"
        subtitle="Every public feature should connect back to what Nexa can actually do today or what the product is actively being built toward."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {FEATURE_GROUPS.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-line bg-panel p-7 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{feature.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{feature.body}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm text-ink">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Link href={feature.href} className="mt-6 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
                Open {feature.title} -&gt;
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section
        title="Runtime principles"
        subtitle="Nexa is being built as production-grade company infrastructure, not a demo shell."
        className="bg-shell"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {RUNTIME_POINTS.map((point) => (
            <div key={point} className="rounded-2xl border border-line bg-white p-5 text-sm leading-7 text-muted shadow-soft">
              {point}
            </div>
          ))}
        </div>
      </Section>

      <section className="border-t border-line bg-ink px-5 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Start with the assistant</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Try Ember 0.5 in Nexa Chat.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/chat" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink">
              Open Nexa Chat
            </Link>
            <Link href="/models" className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white">
              View model family
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
