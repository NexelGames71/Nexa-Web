import { PLAN_LIMITS, formatLimitValue } from "./plan-limits";

export const BILLING_PLAN_KEYS = ["plus", "pro", "premium", "business"];

export const BILLING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    priceMonthly: 0,
    period: "",
    description: "Start with core Nexa chat access and light daily usage.",
    features: ["Core model", "Basic chat history", "Limited uploads", "Community support"],
    cta: { href: "/signup", label: "Start free" },
    paypalEnabled: false,
    highlighted: false,
    limits: PLAN_LIMITS.starter,
  },
  {
    id: "plus",
    name: "Nexa Plus",
    price: "$17",
    priceMonthly: 17,
    period: "/ month",
    description: "Unlock the full personal Nexa experience for everyday AI work.",
    features: [
      "Advanced models",
      "Advanced image creation with thinking",
      "Expanded memory across chats",
      "Coding assistant access",
      "Expanded research",
      "Projects and custom assistants",
    ],
    cta: { href: "/checkout?plan=plus", label: "Upgrade to Plus" },
    paypalEnabled: true,
    highlighted: true,
    limits: PLAN_LIMITS.plus,
  },
  {
    id: "pro",
    name: "Nexa Pro",
    price: "$90",
    priceMonthly: 90,
    period: "/ month",
    description: "Maximize productivity with higher access, stronger models, and faster creative work.",
    features: [
      "Everything in Plus",
      "About 5x more usage than Plus",
      "Frontier Pro model routing",
      "Maximum access to coding tools",
      "Maximum deep research",
      "Unlimited core chat subject to abuse guardrails",
      "Unlimited and faster image creation subject to abuse guardrails",
      "Maximum memory and context",
      "Early access to experimental features",
    ],
    cta: { href: "/checkout?plan=pro", label: "Upgrade to Pro" },
    paypalEnabled: true,
    highlighted: false,
    limits: PLAN_LIMITS.pro,
  },
  {
    id: "premium",
    name: "Nexa Premium",
    price: "$120",
    priceMonthly: 120,
    period: "/ month",
    description: "For heavy AI work with premium limits, Deep Thinker access, and priority support.",
    features: ["Everything in Pro", "Highest Deep Thinker access", "Premium image quality", "Custom assistant workflows", "Priority plus support"],
    cta: { href: "/checkout?plan=premium", label: "Go Premium" },
    paypalEnabled: true,
    highlighted: false,
    limits: PLAN_LIMITS.premium,
  },
  {
    id: "business",
    name: "Nexa Business",
    price: "$20",
    priceMonthly: 20,
    period: "/ seat / month",
    description: "A secure workspace with company context and tools for teams.",
    features: [
      "Access Nexa across desktop and mobile apps",
      "AI for chat, coding, analysis, and workflows",
      "Connect company tools and knowledge sources",
      "Team agent plugins and shared context",
      "Centralized billing and administration",
      "Usage analytics, budgeting, and spend controls",
      "Secure workspace with SSO and MFA readiness",
      "No training on business data by default",
    ],
    cta: { href: "/checkout?plan=business", label: "Start Business" },
    paypalEnabled: true,
    billingType: "per_seat",
    highlighted: false,
    limits: PLAN_LIMITS.business,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceMonthly: null,
    period: "",
    description: "For custom pricing, security review, private deployments, and dedicated support.",
    features: ["Custom contracts", "Private deployment options", "Security review", "Dedicated support"],
    cta: { href: "/enterprise", label: "Contact sales" },
    paypalEnabled: false,
    highlighted: false,
    limits: PLAN_LIMITS.enterprise,
  },
];

export const PAID_BILLING_PLANS = BILLING_PLANS.filter((plan) => plan.paypalEnabled);

export const NEXA_PLUS_PLAN = BILLING_PLANS.find((plan) => plan.id === "plus");

export function getBillingPlan(planKey) {
  const normalized = String(planKey || "").trim().toLowerCase();
  return BILLING_PLANS.find((plan) => plan.id === normalized) || null;
}

export function getPlanLimitHighlights(plan) {
  const limits = plan?.limits || PLAN_LIMITS[plan?.id] || {};
  if (limits.custom) {
    return ["Custom usage limits", "Private deployment options", "Dedicated support"];
  }

  const items = [];
  if (limits.chatMessages?.unlimited) {
    items.push("Unlimited core chat subject to abuse guardrails");
  } else if (limits.chatMessages?.day > 0) {
    items.push(`${formatLimitValue("chat_messages", limits.chatMessages.day)} chats/day`);
  }
  if (limits.imageGenerations?.unlimited) {
    items.push("Unlimited image creation subject to abuse guardrails");
  } else if (limits.imageGenerations?.day > 0) {
    items.push(`${formatLimitValue("image_generations", limits.imageGenerations.day)} images/day`);
  }
  if (limits.deepThinkerMessages?.locked) {
    items.push("Deep Thinker locked");
  } else if (limits.deepThinkerMessages?.day) {
    items.push(`${formatLimitValue("deep_thinker_messages", limits.deepThinkerMessages.day)} Deep Thinker/day`);
  }
  if (limits.storageBytes) {
    const storageLimit =
      typeof limits.storageBytes === "number"
        ? limits.storageBytes
        : limits.storageBytes.perSeat || limits.storageBytes.value || 0;
    if (storageLimit) {
      items.push(`${formatLimitValue("storage_bytes", storageLimit)} storage${limits.storageBytes?.perSeat ? "/seat" : ""}`);
    }
  }
  if (limits.voiceMinutes?.month) {
    items.push(`${formatLimitValue("voice_minutes", limits.voiceMinutes.month)} voice min/month`);
  }
  return items.slice(0, 5);
}
