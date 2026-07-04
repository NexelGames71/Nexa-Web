import { getBillingPlan, getPayPalPlanId } from "../../../../../lib/billing-plans";
import { requireUserFromRequest } from "../../../../../lib/server/appwrite";
import { getBillingProfileForUser } from "../../../../../lib/server/billing";
import { createPayPalSubscription } from "../../../../../lib/server/paypal";

function siteOrigin(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "";
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedPlanKey = String(body.planKey || body.planId || "plus").trim().toLowerCase();
    const plan = getBillingPlan(requestedPlanKey);

    if (!plan || !plan.paypalEnabled) {
      return Response.json({ error: "Unsupported checkout plan." }, { status: 400 });
    }

    const billingProfile = await getBillingProfileForUser((auth as any).user.$id);
    if (billingProfile.plan === plan.id) {
      return Response.json(
        {
          error: `You are already subscribed to ${plan.name}. Choose a different plan to change your subscription.`,
          code: "same_plan_subscription",
          currentPlan: {
            id: billingProfile.plan,
            name: billingProfile.planName,
          },
        },
        { status: 409 },
      );
    }

    const paypalPlanId = getPayPalPlanId(plan.id);
    if (!paypalPlanId) {
      return Response.json(
        { error: `Missing PayPal plan ID for ${plan.name}.` },
        { status: 500 },
      );
    }

    const origin = siteOrigin(request);
    const subscription = await createPayPalSubscription({
      planId: paypalPlanId,
      returnUrl: `${origin}/checkout/success?plan=${encodeURIComponent(plan.id)}`,
      cancelUrl: `${origin}/checkout?plan=${encodeURIComponent(plan.id)}&paypal=cancelled`,
      customId: (auth as any).user.$id,
    });

    return Response.json({
      id: subscription.id,
      status: subscription.status,
      plan: {
        id: plan.id,
        name: plan.name,
        paypalPlanId,
      },
      links: subscription.links || [],
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to create PayPal subscription." },
      { status: error?.status || 500 },
    );
  }
}
