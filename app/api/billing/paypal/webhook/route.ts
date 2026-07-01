import {
  PAYPAL_SUBSCRIPTION_EVENTS,
  verifyPayPalWebhookSignature,
} from "../../../../../lib/server/paypal";
import { createAdminAuditLog } from "../../../../../lib/server/admin-audit";
import {
  createPaymentFromPayPalEvent,
  isPayPalPaymentEvent,
  isPayPalSubscriptionEvent,
  upsertSubscriptionFromPayPalEvent,
} from "../../../../../lib/server/billing";

export async function POST(request: Request) {
  let event: any;

  try {
    event = await request.json();
  } catch {
    return Response.json({ error: "Invalid PayPal webhook JSON." }, { status: 400 });
  }

  try {
    const verified = await verifyPayPalWebhookSignature({
      headers: request.headers,
      body: event,
    });

    if (!verified) {
      return Response.json({ error: "Invalid PayPal webhook signature." }, { status: 400 });
    }

    const eventType = String(event.event_type || "");
    if (!PAYPAL_SUBSCRIPTION_EVENTS.includes(eventType)) {
      return Response.json({ ok: true, ignored: true, eventType });
    }

    let subscription = null;
    let payment = null;

    if (isPayPalSubscriptionEvent(eventType)) {
      subscription = await upsertSubscriptionFromPayPalEvent(event);
    }

    if (isPayPalPaymentEvent(eventType)) {
      payment = await createPaymentFromPayPalEvent(event);
    }

    await createAdminAuditLog({
      adminId: "paypal-webhook",
      action: eventType,
      targetType: isPayPalPaymentEvent(eventType) ? "payment" : "subscription",
      targetId:
        payment?.paymentId ||
        payment?.$id ||
        subscription?.subscriptionId ||
        subscription?.$id ||
        event.resource?.id ||
        "",
      metadata: {
        paypalEventId: event.id || "",
        paypalResourceId: event.resource?.id || "",
        eventType,
      },
    });

    return Response.json({
      ok: true,
      eventType,
      resourceId: event.resource?.id || "",
      subscriptionId: subscription?.subscriptionId || subscription?.$id || "",
      paymentId: payment?.paymentId || payment?.$id || "",
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to process PayPal webhook." },
      { status: error?.status || 500 },
    );
  }
}
