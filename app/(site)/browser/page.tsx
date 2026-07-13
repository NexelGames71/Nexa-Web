import Link from "next/link";
import type { Metadata } from "next";

import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

export const metadata: Metadata = {
  title: "AI Browser",
  description:
    "Preview Nexa Browser, the Nexa product direction for page-aware assistance, research support, summaries, and permission-aware web workflows.",
  alternates: {
    canonical: "/browser",
  },
};

const BROWSER_SECTIONS = [
  { title: "Page understanding", body: "Nexa Browser is designed to summarize pages, explain content, and help users research faster." },
  { title: "Assistant panel", body: "The browser direction keeps Nexa beside the page instead of separating web work from chat." },
  { title: "Permission-aware actions", body: "Sensitive browser actions should require explicit user approval before Nexa acts." },
  { title: "Model integration", body: "Browser workflows are planned to use the same Ember-powered assistant stack as Nexa Chat." },
  { title: "Product direction", body: "The roadmap includes tab context, form assistance, workflow guidance, and safer automation controls." },
];

export default function BrowserPage() {
  return (
    <>
      <PageHero
        eyebrow="Nexa Browser"
        title="Browse the web with Nexa beside you"
        subtitle="Nexa Browser is the product direction for page-aware assistance, research support, summaries, and user-approved browser workflows."
        primaryCta={{ href: "/features", label: "See platform features" }}
      />
      <Section title="Browser direction">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BROWSER_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Use <Link href="/chat" className="text-ink underline underline-offset-4">Nexa Chat</Link> today with Ember 0.5 while browser-specific workflows continue to mature.
        </p>
      </Section>
    </>
  );
}
