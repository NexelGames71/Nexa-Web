import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the Nexa team"
        subtitle="Sales, support, and partnerships — we respond within two business days."
      />
      <Section title="Send a message">
        <form className="mx-auto max-w-xl space-y-4 rounded-3xl border border-line bg-panel p-8 shadow-soft">
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Work email"
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none"
            required
          />
          <textarea
            name="message"
            placeholder="How can we help?"
            rows={5}
            className="w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none"
            required
          />
          <button type="submit" className="w-full rounded-2xl bg-ink py-3 text-sm font-medium text-white">
            Submit (demo form)
          </button>
          <p className="text-center text-xs text-muted">Form is UI-only until backend wiring is added.</p>
        </form>
      </Section>
    </>
  );
}
