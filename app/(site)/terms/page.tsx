import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" />
      <Section title="Agreement">
        <div className="max-w-3xl space-y-4 text-sm leading-7 text-muted">
          <p>
            By using Nexa AI you agree to use the service lawfully, not abuse rate limits or APIs, and
            respect intellectual property of others.
          </p>
          <p>
            Paid plans renew monthly unless cancelled. Enterprise terms are governed by separate agreements.
          </p>
        </div>
      </Section>
    </>
  );
}
