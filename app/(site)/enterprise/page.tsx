import Link from "next/link";
import PageHero from "../../../components/marketing/PageHero";
import Section from "../../../components/marketing/Section";
import { ENTERPRISE_FEATURES } from "../../../lib/site-content";

export default function EnterprisePage() {
  return (
    <>
      <PageHero
        eyebrow="Enterprise"
        title="AI for your organization, on your terms"
        subtitle="Custom models, private deployments, team controls, and enterprise-grade security."
        primaryCta={{ href: "/contact", label: "Contact sales" }}
      />
      <Section title="What enterprises get">
        <ul className="grid gap-4 md:grid-cols-2">
          {ENTERPRISE_FEATURES.map((item) => (
            <li key={item} className="rounded-2xl border border-line bg-panel px-5 py-4 text-sm">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center">
          <Link href="/security" className="text-sm font-medium underline underline-offset-4">
            Review security practices →
          </Link>
        </p>
      </Section>
    </>
  );
}
