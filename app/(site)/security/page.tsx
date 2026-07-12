import type { Metadata } from "next";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { SECURITY_SECTIONS } from "../../../lib/site-content";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Review Nexa AI security practices for privacy, encryption, responsible data handling, and enterprise-grade assistant workflows.",
  alternates: {
    canonical: "/security",
  },
};

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Security at Nexa"
        subtitle="Encryption, privacy controls, and responsible data handling."
      />
      <Section title="Practices">
        <div className="grid gap-5 md:grid-cols-3">
          {SECURITY_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{section.body}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
