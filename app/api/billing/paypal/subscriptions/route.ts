import { NEXA_PLUS_PLAN, PAYPAL_PLUS_PLAN_ID } from "../../../../../lib/billing-plans";
import { requireUserFromRequest } from "../../../../../lib/server/appwrite";
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
    if (!PAYPAL_PLUS_PLAN_ID) {
      return Response.json(
        { error: "Missing PAYPAL_PLUS_PLAN_ID for Nexa Plus checkout." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlanId = String(body.planId || PAYPAL_PLUS_PLAN_ID).trim();
    if (requestedPlanId !== PAYPAL_PLUS_PLAN_ID) {
      return Response.json({ error: "Unsupported PayPal plan." }, { status: 400 });
    }

    const origin = siteOrigin(request);
    const subscription = await createPayPalSubscription({
      planId: PAYPAL_PLUS_PLAN_ID,
      returnUrl: `${origin}/settings/billing?paypal=success`,
      cancelUrl: `${origin}/settings/billing?paypal=cancelled`,
      customId: (auth as any).user.$id,
    });

    return Response.json({
      id: subscription.id,
      status: subscription.status,
      plan: {
        id: NEXA_PLUS_PLAN.id,
        name: NEXA_PLUS_PLAN.name,
        paypalPlanId: PAYPAL_PLUS_PLAN_ID,
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
