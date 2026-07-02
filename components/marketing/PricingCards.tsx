import Link from "next/link";
import { NEXA_PLUS_PLAN } from "../../lib/billing-plans";
import { PRICING_PLANS } from "../../lib/site-content";

export default function PricingCards() {
  const plans = PRICING_PLANS.map((plan) =>
    plan.id === "pro"
      ? {
          ...plan,
          id: NEXA_PLUS_PLAN.id,
          name: NEXA_PLUS_PLAN.name,
          price: NEXA_PLUS_PLAN.price,
          period: NEXA_PLUS_PLAN.period,
          description: NEXA_PLUS_PLAN.description,
          features: NEXA_PLUS_PLAN.features,
          cta: { href: "/signup", label: "Upgrade to Plus" },
        }
      : plan,
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`flex flex-col rounded-3xl border p-6 shadow-soft ${
            plan.highlighted ? "border-ink bg-ink text-white" : "border-line bg-panel text-ink"
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-2xl font-semibold">
              {plan.price}
              <span className={`text-sm font-normal ${plan.highlighted ? "text-white/70" : "text-muted"}`}>
                {plan.period}
              </span>
            </p>
          </div>
          <p className={`mt-3 text-sm leading-6 ${plan.highlighted ? "text-white/80" : "text-muted"}`}>
            {plan.description}
          </p>
          <ul className={`mt-6 flex-1 space-y-2 text-sm ${plan.highlighted ? "text-white/90" : "text-ink"}`}>
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span aria-hidden>✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            href={plan.cta.href}
            className={`mt-8 rounded-full px-4 py-3 text-center text-sm font-medium transition ${
              plan.highlighted
                ? "bg-white text-ink hover:bg-white/90"
                : "bg-ink text-white hover:opacity-90"
            }`}
          >
            {plan.cta.label}
          </Link>
        </article>
      ))}
    </div>
  );
}
