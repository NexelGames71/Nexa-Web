import type { Metadata } from "next";
import PageHero from "../../../components/marketing/PageHero";
import PricingCards from "../../../components/marketing/PricingCards";
import Section from "../../../components/marketing/Section";
import PromotionSpotlight from "../../../components/promotions/PromotionSpotlight";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Nexa AI plans for chat, memory, image generation, model access, team seats, and enterprise support.",
  alternates: {
    canonical: "/pricing",
  },
};

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
      <div className="mx-auto max-w-6xl px-5 py-8">
        <PromotionSpotlight surface="pricing" />
      </div>
      <Section title="Compare plans">
        <PricingCards />
      </Section>
    </>
  );
}
