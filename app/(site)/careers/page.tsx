import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { CAREERS } from "../../../lib/site-content";

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Join the Nexa team"
        subtitle="We're building memory-first AI tools — remote-friendly roles below."
        primaryCta={{ href: "/contact", label: "Get in touch" }}
      />
      <Section title="Open roles">
        <div className="space-y-4">
          {CAREERS.map((role) => (
            <article key={role.title} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-panel p-6 shadow-soft">
              <div>
                <h3 className="font-semibold">{role.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {role.team} · {role.location}
                </p>
              </div>
              <span className="rounded-full bg-shell px-4 py-2 text-xs font-medium text-muted">Apply via contact</span>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
