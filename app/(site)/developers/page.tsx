import type { Metadata } from "next";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Build with Nexa AI using developer documentation, API keys, examples, SDKs, streaming chat, and memory integrations.",
  alternates: {
    canonical: "/developers",
  },
};

const DEV_SECTIONS = [
  { title: "Documentation", body: "Guides for authentication, chat completions, memory, and streaming." },
  { title: "API Keys", body: "Create and rotate keys from your account settings after sign-up." },
  { title: "Examples", body: "Sample apps for Next.js, Python, and curl." },
  { title: "Libraries", body: "TypeScript and Python SDKs with typed responses." },
];

export default function DevelopersPage() {
  return (
    <>
      <PageHero
        eyebrow="Developers"
        title="Build with Nexa"
        subtitle="Documentation, keys, examples, and client libraries."
        primaryCta={{ href: "/api", label: "API overview" }}
        secondaryCta={{ href: "/signup", label: "Create account" }}
      />
      <Section title="Developer hub">
        <div className="grid gap-5 md:grid-cols-2">
          {DEV_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
