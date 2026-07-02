export const PAYPAL_PLUS_PLAN_ID =
  process.env.NEXT_PUBLIC_PAYPAL_PLUS_PLAN_ID ||
  process.env.PAYPAL_PLUS_PLAN_ID ||
  "";

export const NEXA_PLUS_PLAN = {
  id: "plus",
  name: "Nexa Plus",
  price: "$17",
  period: "/ month",
  description: "For power users who need Think models, more memory, and priority access.",
  features: ["Nexa Think", "Expanded memory", "Voice preview", "Priority support"],
  paypalPlanId: PAYPAL_PLUS_PLAN_ID,
};
