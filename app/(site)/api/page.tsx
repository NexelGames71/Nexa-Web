import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { API_SECTIONS } from "../../../lib/site-content";

export const metadata: Metadata = {
  title: "API",
  description:
    "Use the Nexa API to add AI chat, model access, memory, and streaming assistant workflows to your products.",
  alternates: {
    canonical: "/api",
  },
};

export default function ApiPage() {
  return (
    <>
      <PageHero
        eyebrow="Developers"
        title="Nexa API"
        subtitle="Use Nexa models in your products with keys, SDKs, and OpenAI-compatible endpoints."
        primaryCta={{ href: "/developers", label: "Read docs" }}
        secondaryCta={{ href: "https://platform-nexaai.netlify.app", label: "Get API access" }}
      />
      <Section title="API surface">
        <div className="grid gap-5 md:grid-cols-2">
          {API_SECTIONS.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="rounded-3xl border border-line bg-panel p-6 shadow-soft transition hover:border-ink/30"
            >
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm text-muted">{section.description}</p>
            </Link>
          ))}
        </div>
        <pre className="mt-10 overflow-x-auto rounded-2xl border border-line bg-ink p-6 text-sm text-white/90">
{`curl https://api.nexa.ai/v1/chat/completions \\
  -H "Authorization: Bearer $NEXA_API_KEY" \\
  -d '{"model":"nexa-fast","messages":[{"role":"user","content":"Hello"}]}'`}
        </pre>
      </Section>
    </>
  );
}
