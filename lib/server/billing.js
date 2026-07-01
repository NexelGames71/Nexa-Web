import { ID, Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  paymentsCollectionId,
  subscriptionsCollectionId,
} from "./appwrite";

function nowIso() {
  return new Date().toISOString();
}

function documentIdFrom(prefix, value) {
  const safe = String(value || `${prefix}_${Date.now()}`)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 64);
  return safe || ID.unique();
}

function paypalStatusFromEvent(eventType, fallback = "") {
  const event = String(eventType || "").toUpperCase();
  if (event.endsWith(".CREATED")) return "created";
  if (event.endsWith(".ACTIVATED")) return "active";
  if (event.endsWith(".CANCELLED")) return "canceled";
  if (event.endsWith(".SUSPENDED")) return "suspended";
  if (event.endsWith(".EXPIRED")) return "expired";
  if (event.endsWith(".COMPLETED")) return "completed";
  if (event.endsWith(".DENIED")) return "failed";
  if (event.endsWith(".REFUNDED")) return "refunded";
  return String(fallback || "unknown").toLowerCase();
}

function extractSubscriptionUserId(resource = {}) {
  return (
    resource.custom_id ||
    resource.customId ||
    resource.subscriber?.payer_id ||
    resource.subscriber?.email_address ||
    ""
  );
}

function extractSubscriptionPlanId(resource = {}) {
  return resource.plan_id || resource.planId || resource.plan?.id || "unknown";
}

function extractPaymentAmount(resource = {}) {
  const amount =
    resource.amount ||
    resource.amount_with_breakdown?.gross_amount ||
    resource.seller_receivable_breakdown?.gross_amount ||
    resource.resource?.amount ||
    {};

  return {
    value: Number(amount.value || amount.total || 0),
    currency: amount.currency_code || amount.currency || "USD",
  };
}

function extractPaymentSubscriptionId(resource = {}) {
  return (
    resource.billing_agreement_id ||
    resource.billingAgreementId ||
    resource.supplementary_data?.related_ids?.subscription_id ||
    resource.subscription_id ||
    ""
  );
}

async function findFirst(collectionId, queries) {
  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, collectionId, [
    ...queries,
    Query.limit(1),
  ]);
  return result.documents[0] || null;
}

export async function upsertSubscriptionFromPayPalEvent(event) {
  const resource = event?.resource || {};
  const paypalSubscriptionId = resource.id || resource.billing_agreement_id || "";
  if (!paypalSubscriptionId) {
    return null;
  }

  const databases = createAdminDatabases();
  const existing = await findFirst(subscriptionsCollectionId, [
    Query.equal("paypalSubscriptionId", paypalSubscriptionId),
  ]);
  const timestamp = nowIso();
  const subscriptionId = existing?.subscriptionId || documentIdFrom("sub", paypalSubscriptionId);
  const payload = {
    subscriptionId,
    userId: existing?.userId || extractSubscriptionUserId(resource) || "unknown",
    planId: existing?.planId || extractSubscriptionPlanId(resource),
    paypalSubscriptionId,
    status: paypalStatusFromEvent(event?.event_type, resource.status),
    currentPeriodStart:
      resource.start_time ||
      resource.billing_info?.cycle_executions?.[0]?.start_time ||
      existing?.currentPeriodStart ||
      "",
    currentPeriodEnd:
      resource.billing_info?.next_billing_time ||
      resource.billing_info?.last_payment?.time ||
      existing?.currentPeriodEnd ||
      "",
    renewalDate: resource.billing_info?.next_billing_time || existing?.renewalDate || "",
    cancelAt: resource.status_update_time && paypalStatusFromEvent(event?.event_type) === "canceled"
      ? resource.status_update_time
      : existing?.cancelAt || "",
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };

  if (existing) {
    return databases.updateDocument(
      databaseId,
      subscriptionsCollectionId,
      existing.$id,
      payload,
    );
  }

  return databases.createDocument(
    databaseId,
    subscriptionsCollectionId,
    subscriptionId,
    payload,
  );
}

export async function createPaymentFromPayPalEvent(event) {
  const resource = event?.resource || {};
  const paypalTransactionId = resource.id || resource.sale_id || resource.capture_id || "";
  if (!paypalTransactionId) {
    return null;
  }

  const existing = await findFirst(paymentsCollectionId, [
    Query.equal("paypalTransactionId", paypalTransactionId),
  ]);
  if (existing) {
    return existing;
  }

  const subscriptionId = extractPaymentSubscriptionId(resource);
  let userId = resource.custom_id || resource.payer?.payer_id || "unknown";
  if (subscriptionId) {
    const subscription = await findFirst(subscriptionsCollectionId, [
      Query.equal("paypalSubscriptionId", subscriptionId),
    ]);
    userId = subscription?.userId || userId;
  }

  const amount = extractPaymentAmount(resource);
  const timestamp = nowIso();
  const paymentId = documentIdFrom("pay", paypalTransactionId);
  const databases = createAdminDatabases();

  return databases.createDocument(
    databaseId,
    paymentsCollectionId,
    paymentId,
    {
      paymentId,
      userId,
      subscriptionId,
      paypalTransactionId,
      amount: amount.value,
      currency: amount.currency,
      status: paypalStatusFromEvent(event?.event_type, resource.state || resource.status),
      paidAt: resource.create_time || resource.update_time || timestamp,
      failureReason: resource.reason_code || resource.status_details?.reason || "",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  );
}

export function isPayPalSubscriptionEvent(eventType) {
  return String(eventType || "").startsWith("BILLING.SUBSCRIPTION.");
}

export function isPayPalPaymentEvent(eventType) {
  return (
    String(eventType || "").startsWith("PAYMENT.SALE.") ||
    String(eventType || "").startsWith("PAYMENT.CAPTURE.")
  );
}
