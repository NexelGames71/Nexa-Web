import PageHero from "../../../components/marketing/PageHero";
import PricingCards from "../../../components/marketing/PricingCards";
import Section from "../../../components/marketing/Section";

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Plans for every stage"
        subtitle="From free Starter to custom Enterprise — pick the model access and limits you need."
        primaryCta={{ href: "/signup", label: "Start free" }}
        secondaryCta={{ href: "/enterprise", label: "Enterprise" }}
      />
      <Section title="Compare plans">
        <PricingCards />
      </Section>
    </>
  );
}
