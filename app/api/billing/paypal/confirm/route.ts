import { getBillingPlan, getPayPalPlanId } from "../../../../../lib/billing-plans";
import { requireUserFromRequest } from "../../../../../lib/server/appwrite";
import { upsertSubscriptionFromPayPalSubscription } from "../../../../../lib/server/billing";
import { getPayPalSubscription } from "../../../../../lib/server/paypal";

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const subscriptionId = String(body.subscriptionId || "").trim();
    const planKey = String(body.planKey || "").trim().toLowerCase();
    const plan = getBillingPlan(planKey);

    if (!subscriptionId) {
      return Response.json({ error: "Missing PayPal subscription ID." }, { status: 400 });
    }

    if (!plan || !plan.paypalEnabled) {
      return Response.json({ error: "Unsupported checkout plan." }, { status: 400 });
    }

    const paypalSubscription = await getPayPalSubscription(subscriptionId);
    const expectedPayPalPlanId = getPayPalPlanId(plan.id);
    const actualPayPalPlanId = paypalSubscription?.plan_id || "";

    if (!expectedPayPalPlanId || actualPayPalPlanId !== expectedPayPalPlanId) {
      return Response.json({ error: "PayPal subscription plan does not match checkout plan." }, { status: 400 });
    }

    const status = String(paypalSubscription?.status || "").toLowerCase();
    if (!["active", "approved"].includes(status)) {
      return Response.json(
        { error: `PayPal subscription is not active yet. Current status: ${status || "unknown"}.` },
        { status: 409 },
      );
    }

    const subscription = await upsertSubscriptionFromPayPalSubscription({
      resource: paypalSubscription,
      userId: (auth as any).user.$id,
      planId: plan.id,
      status,
    });

    return Response.json({
      ok: true,
      plan: {
        id: plan.id,
        name: plan.name,
      },
      subscription: {
        id: subscription.subscriptionId || subscription.$id,
        status: subscription.status,
        paypalSubscriptionId: subscription.paypalSubscriptionId,
        renewalDate: subscription.renewalDate || "",
        currentPeriodEnd: subscription.currentPeriodEnd || "",
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to confirm PayPal subscription." },
      { status: error?.status || 500 },
    );
  }
}
