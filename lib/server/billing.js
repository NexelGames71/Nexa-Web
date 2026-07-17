import { ID, Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  paymentsCollectionId,
  subscriptionsCollectionId,
} from "./appwrite";
import { createSupabaseAdminClient, supabaseConfigured, throwSupabaseError } from "./supabase";
import { getBillingPlan } from "../billing-plans";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "approved", "created"];

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
  const paypalPlanId = resource.plan_id || resource.planId || resource.plan?.id || "";
  return paypalPlanId || "unknown";
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

function normalizeSubscription(document = {}) {
  return {
    id: document.subscriptionId || document.subscription_id || document.$id || "",
    planId: document.planId || document.plan_id || "",
    status: String(document.status || "").toLowerCase(),
    paypalSubscriptionId: document.paypalSubscriptionId || document.paypal_subscription_id || "",
    renewalDate: document.renewalDate || document.renewal_date || "",
    currentPeriodEnd: document.currentPeriodEnd || document.current_period_end || "",
    updatedAt: document.updatedAt || document.updated_at || document.$updatedAt || "",
  };
}

function subscriptionField(document = {}, camelKey, snakeKey, fallback = "") {
  return document?.[camelKey] ?? document?.[snakeKey] ?? fallback;
}

function subscriptionRowFromPayload(payload = {}) {
  return {
    subscription_id: payload.subscriptionId,
    user_id: payload.userId,
    plan_id: payload.planId,
    paypal_subscription_id: payload.paypalSubscriptionId || null,
    status: payload.status,
    current_period_start: payload.currentPeriodStart || null,
    current_period_end: payload.currentPeriodEnd || null,
    renewal_date: payload.renewalDate || null,
    cancel_at: payload.cancelAt || null,
    created_at: payload.createdAt,
    updated_at: payload.updatedAt,
  };
}

function paymentRowFromPayload(payload = {}) {
  return {
    payment_id: payload.paymentId,
    user_id: payload.userId,
    subscription_id: payload.subscriptionId || null,
    paypal_transaction_id: payload.paypalTransactionId || null,
    amount: payload.amount,
    currency: payload.currency,
    status: payload.status,
    paid_at: payload.paidAt || null,
    failure_reason: payload.failureReason || null,
    created_at: payload.createdAt,
    updated_at: payload.updatedAt,
  };
}

async function findSupabaseSubscriptionByPayPalId(paypalSubscriptionId) {
  if (!supabaseConfigured || !paypalSubscriptionId) {
    return null;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("nexa_subscriptions")
    .select("*")
    .eq("paypal_subscription_id", paypalSubscriptionId)
    .maybeSingle();
  throwSupabaseError(error, "Failed to load Supabase subscription.");
  return data || null;
}

export async function getBillingProfileForUser(userId) {
  if (!userId) {
    return {
      plan: "starter",
      planName: "Starter",
      subscription: null,
      subscriptions: [],
    };
  }

  if (supabaseConfigured) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("nexa_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    throwSupabaseError(error, "Failed to load Supabase billing profile.");

    const subscriptions = (data || []).map(normalizeSubscription);
    const activeSubscription =
      subscriptions.find((subscription) =>
        ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
      ) || null;
    const activePlan = getBillingPlan(activeSubscription?.planId || "starter");

    return {
      plan: activeSubscription?.planId || "starter",
      planName: activePlan?.name || activeSubscription?.planId || "Starter",
      subscription: activeSubscription,
      subscriptions,
    };
  }

  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, subscriptionsCollectionId, [
    Query.equal("userId", userId),
    Query.orderDesc("updatedAt"),
    Query.limit(20),
  ]);
  const subscriptions = (result.documents || []).map(normalizeSubscription);
  const activeSubscription =
    subscriptions.find((subscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status),
    ) || null;
  const activePlan = getBillingPlan(activeSubscription?.planId || "starter");

  return {
    plan: activeSubscription?.planId || "starter",
    planName: activePlan?.name || activeSubscription?.planId || "Starter",
    subscription: activeSubscription,
    subscriptions,
  };
}

export async function upsertSubscriptionFromPayPalEvent(event) {
  const resource = event?.resource || {};
  const paypalSubscriptionId = resource.id || resource.billing_agreement_id || "";
  if (!paypalSubscriptionId) {
    return null;
  }

  const databases = supabaseConfigured ? null : createAdminDatabases();
  const existing = supabaseConfigured
    ? await findSupabaseSubscriptionByPayPalId(paypalSubscriptionId)
    : await findFirst(subscriptionsCollectionId, [
        Query.equal("paypalSubscriptionId", paypalSubscriptionId),
      ]);
  const timestamp = nowIso();
  const subscriptionId = subscriptionField(existing, "subscriptionId", "subscription_id") || documentIdFrom("sub", paypalSubscriptionId);
  const payload = {
    subscriptionId,
    userId: subscriptionField(existing, "userId", "user_id") || extractSubscriptionUserId(resource) || "unknown",
    planId: subscriptionField(existing, "planId", "plan_id") || extractSubscriptionPlanId(resource),
    paypalSubscriptionId,
    status: paypalStatusFromEvent(event?.event_type, resource.status),
    currentPeriodStart:
      resource.start_time ||
      resource.billing_info?.cycle_executions?.[0]?.start_time ||
      subscriptionField(existing, "currentPeriodStart", "current_period_start") ||
      "",
    currentPeriodEnd:
      resource.billing_info?.next_billing_time ||
      resource.billing_info?.last_payment?.time ||
      subscriptionField(existing, "currentPeriodEnd", "current_period_end") ||
      "",
    renewalDate: resource.billing_info?.next_billing_time || subscriptionField(existing, "renewalDate", "renewal_date") || "",
    cancelAt: resource.status_update_time && paypalStatusFromEvent(event?.event_type) === "canceled"
      ? resource.status_update_time
      : subscriptionField(existing, "cancelAt", "cancel_at") || "",
    createdAt: subscriptionField(existing, "createdAt", "created_at") || timestamp,
    updatedAt: timestamp,
  };

  if (supabaseConfigured) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("nexa_subscriptions")
      .upsert(subscriptionRowFromPayload(payload), { onConflict: "subscription_id" })
      .select()
      .single();
    throwSupabaseError(error, "Failed to upsert Supabase subscription.");
    return data;
  }

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

export async function upsertSubscriptionFromPayPalSubscription({
  resource,
  userId,
  planId,
  status,
}) {
  const paypalSubscriptionId = resource?.id || "";
  if (!paypalSubscriptionId) {
    throw new Error("Missing PayPal subscription ID.");
  }

  const databases = supabaseConfigured ? null : createAdminDatabases();
  const existing = supabaseConfigured
    ? await findSupabaseSubscriptionByPayPalId(paypalSubscriptionId)
    : await findFirst(subscriptionsCollectionId, [
        Query.equal("paypalSubscriptionId", paypalSubscriptionId),
      ]);
  const timestamp = nowIso();
  const subscriptionId = subscriptionField(existing, "subscriptionId", "subscription_id") || documentIdFrom("sub", paypalSubscriptionId);
  const resolvedPlanId =
    planId ||
    subscriptionField(existing, "planId", "plan_id") ||
    extractSubscriptionPlanId(resource);
  const payload = {
    subscriptionId,
    userId: userId || subscriptionField(existing, "userId", "user_id") || extractSubscriptionUserId(resource) || "unknown",
    planId: resolvedPlanId,
    paypalSubscriptionId,
    status: String(status || resource.status || existing?.status || "active").toLowerCase(),
    currentPeriodStart:
      resource.start_time ||
      resource.billing_info?.cycle_executions?.[0]?.start_time ||
      subscriptionField(existing, "currentPeriodStart", "current_period_start") ||
      "",
    currentPeriodEnd:
      resource.billing_info?.next_billing_time ||
      resource.billing_info?.last_payment?.time ||
      subscriptionField(existing, "currentPeriodEnd", "current_period_end") ||
      "",
    renewalDate: resource.billing_info?.next_billing_time || subscriptionField(existing, "renewalDate", "renewal_date") || "",
    cancelAt: subscriptionField(existing, "cancelAt", "cancel_at") || "",
    createdAt: subscriptionField(existing, "createdAt", "created_at") || timestamp,
    updatedAt: timestamp,
  };

  if (supabaseConfigured) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("nexa_subscriptions")
      .upsert(subscriptionRowFromPayload(payload), { onConflict: "subscription_id" })
      .select()
      .single();
    throwSupabaseError(error, "Failed to upsert Supabase subscription.");
    return data;
  }

  if (existing) {
    return databases.updateDocument(databaseId, subscriptionsCollectionId, existing.$id, payload);
  }

  return databases.createDocument(databaseId, subscriptionsCollectionId, subscriptionId, payload);
}

export async function createPaymentFromPayPalEvent(event) {
  const resource = event?.resource || {};
  const paypalTransactionId = resource.id || resource.sale_id || resource.capture_id || "";
  if (!paypalTransactionId) {
    return null;
  }

  if (supabaseConfigured) {
    const supabase = createSupabaseAdminClient();
    const { data: existingPayment, error: paymentLookupError } = await supabase
      .from("nexa_payments")
      .select("*")
      .eq("paypal_transaction_id", paypalTransactionId)
      .maybeSingle();
    throwSupabaseError(paymentLookupError, "Failed to load Supabase payment.");
    if (existingPayment) {
      return existingPayment;
    }
  }

  const existing = supabaseConfigured
    ? null
    : await findFirst(paymentsCollectionId, [
        Query.equal("paypalTransactionId", paypalTransactionId),
      ]);
  if (existing) {
    return existing;
  }

  const subscriptionId = extractPaymentSubscriptionId(resource);
  let userId = resource.custom_id || resource.payer?.payer_id || "unknown";
  if (subscriptionId) {
    const subscription = supabaseConfigured
      ? await findSupabaseSubscriptionByPayPalId(subscriptionId)
      : await findFirst(subscriptionsCollectionId, [
          Query.equal("paypalSubscriptionId", subscriptionId),
        ]);
    userId = subscriptionField(subscription, "userId", "user_id") || userId;
  }

  const amount = extractPaymentAmount(resource);
  const timestamp = nowIso();
  const paymentId = documentIdFrom("pay", paypalTransactionId);
  if (supabaseConfigured) {
    const supabase = createSupabaseAdminClient();
    const payload = {
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
    };
    const { data, error } = await supabase
      .from("nexa_payments")
      .insert(paymentRowFromPayload(payload))
      .select()
      .single();
    throwSupabaseError(error, "Failed to create Supabase payment.");
    return data;
  }

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
