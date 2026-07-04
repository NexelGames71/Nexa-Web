import PageHero from "../../../components/marketing/PageHero";
import PricingCards from "../../../components/marketing/PricingCards";
import Section from "../../../components/marketing/Section";

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple plans for Nexa"
        subtitle="Start free, upgrade when you need more model access, image generation, memory, team seats, or support."
        primaryCta={{ href: "/signup", label: "Start free" }}
        secondaryCta={{ href: "/enterprise", label: "Enterprise" }}
      />
      <Section title="Compare plans">
        <PricingCards />
      </Section>
    </>
  );
}
