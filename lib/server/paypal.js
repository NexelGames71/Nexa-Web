const PAYPAL_ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const PAYPAL_BASE_URL =
  PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const paypalClientId = process.env.PAYPAL_CLIENT_ID || "";
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
export const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID || "";

export const PAYPAL_SUBSCRIPTION_EVENTS = [
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.SALE.DENIED",
  "PAYMENT.SALE.REFUNDED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
];

export function getPayPalStatus() {
  return {
    environment: PAYPAL_ENV,
    configured: Boolean(paypalClientId && paypalClientSecret && paypalWebhookId),
    clientIdConfigured: Boolean(paypalClientId),
    secretConfigured: Boolean(paypalClientSecret),
    webhookConfigured: Boolean(paypalWebhookId),
    supportedEvents: PAYPAL_SUBSCRIPTION_EVENTS,
  };
}

export function ensurePayPalConfig() {
  const missing = [];
  if (!paypalClientId) missing.push("PAYPAL_CLIENT_ID");
  if (!paypalClientSecret) missing.push("PAYPAL_CLIENT_SECRET");
  if (!paypalWebhookId) missing.push("PAYPAL_WEBHOOK_ID");
  if (missing.length > 0) {
    throw new Error(`Missing PayPal config: ${missing.join(", ")}`);
  }
}

async function paypalRequest(pathname, options = {}) {
  ensurePayPalConfig();
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || data?.name || `PayPal request failed (${response.status}).`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getPayPalAccessToken() {
  if (!paypalClientId || !paypalClientSecret) {
    throw new Error("Missing PayPal config: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET");
  }

  const credentials = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || "PayPal access token request failed.");
  }

  return data.access_token;
}

export async function createPayPalProduct({ name, description, type = "SERVICE", category = "SOFTWARE" }) {
  return paypalRequest("/v1/catalogs/products", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `nexa-product-${Date.now()}`,
    },
    body: JSON.stringify({
      name,
      description,
      type,
      category,
    }),
  });
}

export async function createPayPalPlan({
  productId,
  name,
  description,
  amount,
  currency = "USD",
  intervalUnit = "MONTH",
  intervalCount = 1,
}) {
  return paypalRequest("/v1/billing/plans", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `nexa-plan-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: String(amount),
              currency_code: currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
}

export async function createPayPalSubscription({ planId, returnUrl, cancelUrl, customId }) {
  return paypalRequest("/v1/billing/subscriptions", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `nexa-subscription-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: "Nexa AI",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
}

export async function getPayPalSubscription(subscriptionId) {
  if (!subscriptionId) {
    throw new Error("Missing PayPal subscription ID.");
  }
  return paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function verifyPayPalWebhookSignature({ headers, body }) {
  ensurePayPalConfig();
  const verification = await paypalRequest("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: paypalWebhookId,
      webhook_event: body,
    }),
  });

  return verification?.verification_status === "SUCCESS";
}
