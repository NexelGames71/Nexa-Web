import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { MODELS } from "../../../lib/site-content";

export default function ModelsPage() {
  return (
    <>
      <PageHero
        eyebrow="Models"
        title="Nexa model family"
        subtitle="Fast for daily chat, Think for balanced reasoning, Deep Think for hard problems."
        primaryCta={{ href: "/chat", label: "Try in chat" }}
        secondaryCta={{ href: "/api", label: "API docs" }}
      />
      <Section title="Available & upcoming">
        <div className="grid gap-5 md:grid-cols-2">
          {MODELS.map((model) => (
            <article key={model.id} className="rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{model.status}</span>
              <h3 className="mt-2 text-xl font-semibold">{model.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{model.description}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Research previews and benchmarks live on the{" "}
          <Link href="/research" className="text-ink underline underline-offset-4">
            Research
          </Link>{" "}
          page.
        </p>
      </Section>
    </>
  );
}
