import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { BRAND } from "../../../lib/site-content";

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title={`The story behind ${BRAND.name}`} />
      <Section title="Our mission">
        <div className="max-w-3xl space-y-4 text-sm leading-7 text-muted">
          <p>
            Nexa started as a personal AI assistant — one that remembers context, searches what you need,
            and helps you ship work faster. Today we are expanding into a full platform: chat, voice,
            agents, APIs, and enterprise deployments.
          </p>
          <p>
            We believe assistants should be transparent about memory and data, fast enough for daily use,
            and deep enough when problems get hard. That is why we built Nexa Fast, Think, and Deep Think
            as first-class models inside one workspace.
          </p>
        </div>
      </Section>
    </>
  );
}
