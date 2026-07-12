import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "../../components/marketing/PageHero";
import PricingCards from "../../components/marketing/PricingCards";
import Section from "../../components/marketing/Section";
import { HERO, HOME_FEATURES, MODELS, TESTIMONIALS } from "../../lib/site-content";

export const metadata: Metadata = {
  title: "Intelligent AI Assistant and Browser",
  description:
    "Nexa AI combines chat, memory, research, productivity tools, automation, and browser assistance in one intelligent AI workspace.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow={HERO.eyebrow}
        title={HERO.title}
        subtitle={HERO.subtitle}
        primaryCta={HERO.primaryCta}
        secondaryCta={HERO.secondaryCta}
      />

      <div className="mx-auto max-w-6xl px-5 mt-4">
        <Link
          href="/teaser"
          className="relative block overflow-hidden rounded-3xl border border-line bg-panel p-6 shadow-soft transition hover:-translate-y-1 hover:border-ink/30"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-60 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">
                New Launch Teaser
              </span>
              <h3 className="text-base font-bold text-ink mt-2">
                Experience the Interactive Nexa AI + Nexa Web Video Teaser
              </h3>
              <p className="text-xs text-muted mt-1">
                Step through the marketing script, listen to the narrator, and play with interactive UI mockups.
              </p>
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-ink/70 shrink-0">
              Launch Teaser Player <span className="ml-2 text-base">→</span>
            </span>
          </div>
        </Link>
      </div>

      <Section
        title="Everything you need in one AI workspace"
        subtitle="Modular chat, agents, and APIs designed for humans who build."
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
                  Explore <span className="ml-2 text-lg">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        title="Models built for speed and depth"
        subtitle="Fast for daily tasks, Think for strategy, Deep Think for complex reasoning."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MODELS.map((model) => (
            <article
              key={model.id}
              className="rounded-2xl border border-line bg-gradient-to-br from-white via-shell to-panel p-5 shadow-soft"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{model.status}</p>
              <h3 className="mt-3 text-xl font-semibold">{model.name}</h3>
              <p className="mt-2 text-sm text-muted">{model.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/models" className="text-sm font-medium text-ink underline underline-offset-4">
            View all models →
          </Link>
        </div>
      </Section>

      <Section
        title="Simple, transparent pricing"
        subtitle="One workspace for individuals, startups, and global teams."
        className="bg-panel/60"
      >
        <PricingCards />
        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-sm font-medium text-ink underline underline-offset-4">
            Compare all plans →
          </Link>
        </div>
      </Section>

      <Section title="Voices from the Nexa community" subtitle="Creators, founders, and researchers build with Nexa every day.">
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.author}
              className="rounded-3xl border border-line bg-panel p-6 shadow-soft"
            >
              <p className="text-base leading-7 text-ink">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 text-sm text-muted">
                <strong className="text-ink">{item.author}</strong> — {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </Section>

      <section className="border-t border-line bg-gradient-to-br from-ink via-[#1a1a1f] to-[#050505] px-5 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Launch in minutes</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Start chatting with Nexa today</h2>
          <p className="mt-4 text-base leading-7 text-white/70">
            Create a free account, connect your memory, and open the chat workspace on any device. Ready when you are.
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
