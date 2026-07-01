import {
  PAYPAL_SUBSCRIPTION_EVENTS,
  verifyPayPalWebhookSignature,
} from "../../../../../lib/server/paypal";

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

    // TODO: Persist into the billing and admin audit collections once the
    // admin operation collections are provisioned.
    return Response.json({
      ok: true,
      eventType,
      resourceId: event.resource?.id || "",
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to process PayPal webhook." },
      { status: error?.status || 500 },
    );
  }
}
