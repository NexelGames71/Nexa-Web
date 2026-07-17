import { getBillingPlan } from "../../../../../lib/billing-plans";
import { requireUserFromRequest } from "../../../../../lib/server/appwrite";
import { getBillingProfileForUser } from "../../../../../lib/server/billing";
import { getIdentityBaseUrl } from "../../../../../lib/server/nexa-identity-flow";

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

    const origin = siteOrigin(request);
    const identityResponse = await fetch(`${getIdentityBaseUrl()}/v1/subscriptions/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(auth as any).jwt}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        planId: plan.id,
        successUrl: `${origin}/checkout/success?plan=${encodeURIComponent(plan.id)}`,
        cancelUrl: `${origin}/checkout?plan=${encodeURIComponent(plan.id)}&paypal=cancelled`,
      }),
    });
    const payload = await identityResponse.json().catch(() => ({}));
    if (!identityResponse.ok || payload?.ok === false) {
      return Response.json(
        { error: payload?.error?.message || "Nexa Identity could not create checkout." },
        { status: identityResponse.status || 500 },
      );
    }

    const checkout = payload?.data || payload;

    return Response.json({
      id: checkout.externalId || "",
      url: checkout.url,
      status: "created",
      plan: {
        id: plan.id,
        name: plan.name,
      },
      links: checkout.url ? [{ rel: "approve", href: checkout.url, method: "GET" }] : [],
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to create PayPal subscription." },
      { status: error?.status || 500 },
    );
  }
}
