import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <Section title="Summary">
        <div className="prose-sm max-w-3xl space-y-4 text-sm leading-7 text-muted">
          <p>
            Nexa collects account information, conversation content, and memory you choose to save in
            order to provide the service. You can export or delete data from Settings → Data Controls.
          </p>
          <p>
            Training on your data is opt-in. See Security and Data Controls for details on encryption
            and retention.
          </p>
        </div>
      </Section>
    </>
  );
}
