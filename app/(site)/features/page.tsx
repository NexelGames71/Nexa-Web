import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { PLATFORM_FEATURES } from "../../../lib/site-content";

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform"
        title="Features built for how you actually work"
        subtitle="Chat, browser, voice, memory, search, agents, and APIs — unified under Nexa AI."
        primaryCta={{ href: "/signup", label: "Get started" }}
        secondaryCta={{ href: "/chat", label: "Open chat" }}
      />
      <Section title="Product suite">
        <div className="space-y-6">
          {PLATFORM_FEATURES.map((feature) => (
            <article key={feature.id} className="rounded-3xl border border-line bg-panel p-8 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                {"badge" in feature && feature.badge ? (
                  <span className="rounded-full bg-shell px-3 py-1 text-xs font-medium text-muted">
                    {feature.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{feature.description}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm text-ink">
                    <span className="text-muted">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted">
          Ready to try it?{" "}
          <Link href="/chat" className="font-medium text-ink underline underline-offset-4">
            Launch Nexa Chat
          </Link>
        </p>
      </Section>
    </>
  );
}
