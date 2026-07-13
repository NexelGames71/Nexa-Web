import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import emberModelArt from "../../../assets/Ember 0.5.png";
import prismModelArt from "../../../assets/Prism 0.5.png";
import Section from "../../../components/marketing/Section";

export const metadata: Metadata = {
  title: "Nexa Models",
  description:
    "Meet Ember 0.5 and Prism 0.5, the first official Nexa model releases for private assistant chat and image generation.",
  alternates: {
    canonical: "/models",
  },
};

const emberStats = [
  { label: "Release", value: "Ember 0.5" },
  { label: "Model type", value: "Text / chat" },
  { label: "Runtime", value: "Nexa Private Runtime" },
  { label: "Context window", value: "Up to 262K tokens" },
  { label: "Max output", value: "8,192 tokens" },
  { label: "Serving modes", value: "Fast, Thinker, Deep Thinker" },
];

const capabilities = [
  {
    title: "Streaming conversations",
    body: "Ember begins responding as tokens are generated, making Nexa feel immediate and interactive instead of waiting for a full response to complete.",
  },
  {
    title: "Everyday assistance",
    body: "Built for clear answers, writing support, explanations, planning, summarization, and practical decision support.",
  },
  {
    title: "Early reasoning",
    body: "Handles multi-step prompts, coding guidance, comparisons, structured plans, and workflow breakdowns with a balanced response style.",
  },
  {
    title: "Browser-aware workflows",
    body: "Designed to support Nexa Browser features such as page understanding, form assistance, research help, and task guidance.",
  },
  {
    title: "Tool routing foundation",
    body: "Structured to support future permission-aware tool use across chat, memory, browser actions, workspace automation, and creative workflows.",
  },
  {
    title: "Private inference first",
    body: "Served through Nexa's private model runtime with CUDA-aware local inference, keeping the core assistant stack under Nexa control.",
  },
];

const accessRows = [
  { label: "Free", value: "Core Ember chat access with starter usage limits." },
  { label: "Plus", value: "Higher message limits, memory features, and richer assistant access." },
  { label: "Pro", value: "Expanded usage for research, coding guidance, strategy, planning, and creative workflows." },
  { label: "Business", value: "Team-ready access with admin controls, analytics, shared workspace direction, and private assistant features." },
];

const prismStats = [
  { label: "Release", value: "Prism 0.5" },
  { label: "Model type", value: "Image generation" },
  { label: "Runtime", value: "Nexa Image Runtime" },
  { label: "Input", value: "Natural-language prompts" },
  { label: "Output", value: "Generated image assets" },
  { label: "Focus", value: "Visual creation and ideation" },
];

const prismCapabilities = [
  {
    title: "Text-to-image creation",
    body: "Turns natural-language prompts into generated visuals for concepts, mockups, creative drafts, and design exploration.",
  },
  {
    title: "Concept direction",
    body: "Built for product concepts, brand visuals, app hero images, environment ideas, and early creative exploration.",
  },
  {
    title: "Prompt refinement",
    body: "Works with Nexa chat so users can describe, revise, and continue visual ideas without leaving the workspace.",
  },
  {
    title: "Library integration",
    body: "Generated images appear in the user's Nexa image library so they can review, reopen, and manage previous outputs.",
  },
];

const roadmap = [
  "Improve first-token latency and warm runtime behavior.",
  "Strengthen code, research, and browser-task reliability.",
  "Expand tool routing with permission-aware browser actions.",
  "Tune response style so Nexa stays direct, professional, and consistent.",
  "Prepare Ember 1.0 as the next larger production model release.",
  "Evolve Prism with stronger prompt following, sharper detail, and richer creative controls.",
];

export default function ModelsPage() {
  return (
    <>
      <section className="overflow-hidden border-b border-line bg-[#050505] px-5 py-10 text-white md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
              First Nexa model
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-7xl">
              Ember <span className="text-orange-400">0.5</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              Nexa's first-generation text model for fast assistance, early reasoning, streaming chat, and agentic workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Try Ember in chat
              </Link>
              <Link
                href="/api"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                View API
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[40px] bg-orange-500/10 blur-3xl" aria-hidden />
            <Image
              src={emberModelArt}
              alt="Introducing Ember 0.5, Nexa's first-generation text model"
              priority
              className="relative rounded-[28px] border border-white/10 shadow-[0_32px_120px_rgba(255,98,0,0.28)]"
            />
          </div>
        </div>
      </section>

      <Section
        title="Built for Nexa's private assistant stack"
        subtitle="Ember 0.5 is the first official model release in the Nexa model family. It powers the core Nexa chat experience and lays the foundation for browser assistance, memory-aware workflows, and permission-safe agent actions."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {emberStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-panel p-5 shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{stat.label}</div>
              <div className="mt-2 text-xl font-semibold text-ink">{stat.value}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="What Ember 0.5 does"
        subtitle="Ember 0.5 focuses on making Nexa useful from day one: clear responses, streaming output, practical reasoning, and a stable foundation for AI-native browser workflows."
        className="bg-panel/50"
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <article key={capability.title} className="rounded-3xl border border-line bg-white p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-ink">{capability.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{capability.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        title="Access and usage"
        subtitle="Ember 0.5 is available across Nexa plans with different usage limits, modes, and product capabilities."
      >
        <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-soft">
          {accessRows.map((row) => (
            <div key={row.label} className="grid gap-2 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[160px_1fr]">
              <div className="text-sm font-semibold text-ink">{row.label}</div>
              <div className="text-sm leading-6 text-muted">{row.value}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Runtime design"
        subtitle="Ember 0.5 is served through the Nexa Private Runtime, not a public placeholder model page."
        className="bg-shell"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <div className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-ink">Mode-based generation</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Nexa routes chat through Ember 0.5 for streaming responses, token tracking, and mode-based generation settings. Fast keeps answers lightweight, Thinker gives more room for planning, and Deep Thinker is reserved for heavier reasoning tasks.
            </p>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-2xl bg-black/[0.04] p-4">
                <div className="font-semibold text-ink">Fast</div>
                <div className="mt-1 text-muted">Short, responsive answers for everyday tasks.</div>
              </div>
              <div className="rounded-2xl bg-black/[0.04] p-4">
                <div className="font-semibold text-ink">Thinker</div>
                <div className="mt-1 text-muted">Balanced reasoning, structure, and planning.</div>
              </div>
              <div className="rounded-2xl bg-black/[0.04] p-4">
                <div className="font-semibold text-ink">Deep Thinker</div>
                <div className="mt-1 text-muted">Longer context and deeper work.</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-ink">Next improvements</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              {roadmap.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <section className="overflow-hidden bg-[#06070b] px-5 py-14 text-white md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(420px,1fr)_minmax(0,0.92fr)] lg:items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-8 rounded-[40px] bg-cyan-500/10 blur-3xl" aria-hidden />
            <Image
              src={prismModelArt}
              alt="Introducing Prism 0.5, Nexa's first-generation image model"
              className="relative rounded-[28px] border border-white/10 shadow-[0_32px_120px_rgba(0,180,255,0.22)]"
            />
          </div>

          <div className="order-1 lg:order-2">
            <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Image model
            </p>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Prism <span className="text-cyan-300">0.5</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              Prism 0.5 is Nexa's first-generation image model, built for visual creation, concept art, image ideation, and creative workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/images"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Open Images
              </Link>
              <Link
                href="/chat"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Create from chat
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section
        title="What Prism 0.5 does"
        subtitle="Prism gives Nexa a dedicated visual model identity for generated images, creative direction, and image-library workflows."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prismStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-panel p-5 shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{stat.label}</div>
              <div className="mt-2 text-xl font-semibold text-ink">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {prismCapabilities.map((capability) => (
            <article key={capability.title} className="rounded-3xl border border-line bg-white p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-ink">{capability.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{capability.body}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
