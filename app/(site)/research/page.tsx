import type { Metadata } from "next";

import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Read Nexa AI model releases, runtime notes, evaluations, and lab updates for AI assistant and browser intelligence work.",
  alternates: {
    canonical: "/research",
  },
};

const RESEARCH_ITEMS = [
  { title: "Model releases", body: "Release notes for Ember, Prism, and future Nexa model family versions." },
  { title: "Runtime evaluation", body: "Internal checks across latency, streaming behavior, image generation, and safety-sensitive workflows." },
  { title: "Lab notes", body: "Engineering notes from Nexa Labs as the assistant, image, voice, and browser systems evolve." },
];

export default function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Nexa Research"
        subtitle="Model releases, runtime notes, evaluations, and lab updates from Nexa Labs."
      />
      <Section title="Research hub">
        <div className="grid gap-5 md:grid-cols-3">
          {RESEARCH_ITEMS.map((item) => (
            <article key={item.title} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
