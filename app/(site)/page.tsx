import Link from "next/link";
import type { Metadata } from "next";

import PricingCards from "../../components/marketing/PricingCards";
import Section from "../../components/marketing/Section";
import { HOME_FEATURES, MODELS } from "../../lib/site-content";

export const metadata: Metadata = {
  title: "Nexa AI - Intelligent AI Assistant Powered by Ember 0.5",
  description:
    "Nexa AI is a private assistant workspace powered by Ember 0.5 for streaming chat, memory-aware workflows, image creation, browser assistance, and productivity.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden border-b border-line bg-[#050505] px-5 py-12 text-white md:py-18">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(430px,1.05fr)] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
              Powered by Ember 0.5
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
              Nexa AI, built around a private model runtime.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              Nexa combines streaming chat, memory, image creation, and browser-aware workflows. Ember 0.5 is the first official Nexa text model powering the core assistant experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Open Nexa Chat
              </Link>
              <Link
                href="/models"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                View models
              </Link>
            </div>
            <dl className="mt-10 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Text model</dt>
                <dd className="mt-2 font-semibold text-white">Ember 0.5</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Image model</dt>
                <dd className="mt-2 font-semibold text-white">Prism 0.5</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-white/42">Runtime</dt>
                <dd className="mt-2 font-semibold text-white">Nexa Private Runtime</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[40px] bg-orange-500/10 blur-3xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_32px_120px_rgba(255,98,0,0.25)]">
              <video
                className="aspect-[16/10] h-full w-full object-cover"
                src="/media/Ember_Reveal.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Ember 0.5 model reveal"
              />
            </div>
          </div>
        </div>
      </section>

      <Section
        title="What Nexa does today"
        subtitle="The public product is centered on the assistant workspace: chat, memory, images, model routing, and account controls."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative overflow-hidden rounded-3xl border border-line bg-panel p-6 shadow-soft transition hover:-translate-y-1 hover:border-ink/30"
            >
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" aria-hidden>
                <div className="h-full w-full bg-gradient-to-br from-ink/5 via-accent-peach/20 to-accent-lilac/30" />
              </div>
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{feature.title}</p>
                <p className="mt-2 text-base font-semibold text-ink">{feature.description}</p>
                <span className="mt-6 inline-flex items-center text-sm font-medium text-ink/70">
                  Explore <span className="ml-2 text-lg">-&gt;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        title="Official Nexa model family"
        subtitle="Ember 0.5 powers core text/chat. Prism 0.5 powers image generation. Future versions will expand capability without exposing underlying provider names."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MODELS.map((model) => (
            <article
              key={model.id}
              className="rounded-2xl border border-line bg-gradient-to-br from-white via-shell to-panel p-5 shadow-soft"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{model.status}</p>
              <h3 className="mt-3 text-xl font-semibold">{model.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{model.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/models" className="text-sm font-medium text-ink underline underline-offset-4">
            View all models -&gt;
          </Link>
        </div>
      </Section>

      <Section
        title="Built around private inference"
        subtitle="Nexa is designed as private company infrastructure first: local/private model APIs, CUDA-aware runtime work, streaming responses, and permission-aware product surfaces."
        className="bg-shell"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-ink">Streaming assistant</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Ember 0.5 streams responses token by token so Nexa feels active while the model is generating instead of waiting for a completed answer.
            </p>
          </article>
          <article className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-ink">Image workspace</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Prism 0.5 is connected to Nexa Images, where users can create, search, reopen, inspect, and manage generated visuals from their account.
            </p>
          </article>
          <article className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-ink">Browser direction</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Nexa is being built toward page understanding, form assistance, research support, and user-approved browser actions with safety controls.
            </p>
          </article>
        </div>
      </Section>

      <Section
        title="Simple, transparent pricing"
        subtitle="Plans map to real product access: higher chat usage, richer assistant features, memory, images, and team controls."
        className="bg-panel/60"
      >
        <PricingCards />
        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-sm font-medium text-ink underline underline-offset-4">
            Compare all plans -&gt;
          </Link>
        </div>
      </Section>

      <section className="border-t border-line bg-gradient-to-br from-ink via-[#1a1a1f] to-[#050505] px-5 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Start with Ember 0.5</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Use Nexa as your daily AI workspace</h2>
          <p className="mt-4 text-base leading-7 text-white/70">
            Open chat for streaming answers, use memory when you want continuity, and create images through the same Nexa account.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink">
              Get started free
            </Link>
            <Link
              href="/enterprise"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
