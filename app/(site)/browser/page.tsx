import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";

const BROWSER_SECTIONS = [
  { title: "Features", body: "AI summaries, tab-aware chat, and smart navigation." },
  { title: "Download", body: "Desktop builds for Windows and macOS — coming soon." },
  { title: "Screenshots", body: "Product gallery will ship with the beta." },
  { title: "AI integration", body: "Same Nexa memory and models as chat." },
  { title: "Roadmap", body: "Extensions, mobile, and team profiles on the roadmap." },
];

export default function BrowserPage() {
  return (
    <>
      <PageHero
        eyebrow="Nexa Browser"
        title="Browse the web with Nexa beside you"
        subtitle="A separate product site for the Nexa Browser — preview what's coming."
        primaryCta={{ href: "/features", label: "See platform features" }}
      />
      <Section title="Product preview">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BROWSER_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-dashed border-line bg-panel p-6">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm text-muted">{section.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Use <Link href="/chat" className="text-ink underline underline-offset-4">Nexa Chat</Link> today while Browser is in development.
        </p>
      </Section>
    </>
  );
}
