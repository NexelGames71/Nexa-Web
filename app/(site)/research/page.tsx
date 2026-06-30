import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

const RESEARCH_ITEMS = [
  { title: "Model releases", body: "Release notes for Fast, Think, and Deep Think." },
  { title: "Benchmarks", body: "Internal evals across reasoning, coding, and safety." },
  { title: "Papers", body: "Research publications from the Nexa lab (coming soon)." },
];

export default function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Nexa Research"
        subtitle="Model releases, benchmarks, and papers — updated as we ship."
      />
      <Section title="Research hub">
        <div className="grid gap-5 md:grid-cols-3">
          {RESEARCH_ITEMS.map((item) => (
            <article key={item.title} className="rounded-3xl border border-dashed border-line bg-panel/80 p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
