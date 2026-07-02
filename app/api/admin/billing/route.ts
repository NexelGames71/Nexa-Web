import { Query } from "node-appwrite";

import {
  billingPlansCollectionId,
  createAdminDatabases,
  databaseId,
  paymentsCollectionId,
  requireAdminFromRequest,
  subscriptionsCollectionId,
} from "../../../../lib/server/appwrite";
import { getPayPalStatus } from "../../../../lib/server/paypal";

function parseJson(value: unknown, fallback: any) {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function planFromDocument(document: any) {
  return {
    id: document.planId || document.$id,
    name: document.name || document.planId || "Unnamed plan",
    priceMonthly: Number(document.priceMonthly || 0),
    priceYearly: Number(document.priceYearly || 0),
    currency: document.currency || "USD",
    paypalProductId: document.paypalProductId || "",
    paypalPlanId: document.paypalPlanId || "",
    paypalSandboxProductId: document.paypalSandboxProductId || "",
    paypalSandboxPlanId: document.paypalSandboxPlanId || "",
    paypalLiveProductId: document.paypalLiveProductId || "",
    paypalLivePlanId: document.paypalLivePlanId || "",
    limits: parseJson(document.limits, {}),
    features: parseJson(document.features, []),
    isPublic: Boolean(document.isPublic),
    status: document.status || "draft",
    updatedAt: document.updatedAt || document.$updatedAt || "",
  };
}

function subscriptionFromDocument(document: any) {
  return {
    id: document.subscriptionId || document.$id,
    userId: document.userId || "",
    planId: document.planId || "",
    paypalSubscriptionId: document.paypalSubscriptionId || "",
    status: document.status || "unknown",
    currentPeriodStart: document.currentPeriodStart || "",
    currentPeriodEnd: document.currentPeriodEnd || "",
    renewalDate: document.renewalDate || "",
    cancelAt: document.cancelAt || "",
    createdAt: document.createdAt || document.$createdAt || "",
    updatedAt: document.updatedAt || document.$updatedAt || "",
  };
}

function paymentFromDocument(document: any) {
  return {
    id: document.paymentId || document.$id,
    userId: document.userId || "",
    subscriptionId: document.subscriptionId || "",
    paypalTransactionId: document.paypalTransactionId || "",
    amount: Number(document.amount || 0),
    currency: document.currency || "USD",
    status: document.status || "unknown",
    paidAt: document.paidAt || "",
    failureReason: document.failureReason || "",
    createdAt: document.createdAt || document.$createdAt || "",
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const databases = createAdminDatabases();
    const [plans, subscriptions, payments] = await Promise.all([
      databases.listDocuments(databaseId, billingPlansCollectionId, [
        Query.orderAsc("name"),
        Query.limit(200),
      ]),
      databases.listDocuments(databaseId, subscriptionsCollectionId, [
        Query.orderDesc("updatedAt"),
        Query.limit(300),
      ]),
      databases.listDocuments(databaseId, paymentsCollectionId, [
        Query.orderDesc("createdAt"),
        Query.limit(300),
      ]),
    ]);

    return Response.json({
      paypal: getPayPalStatus(),
      plans: (plans.documents || []).map(planFromDocument),
      subscriptions: (subscriptions.documents || []).map(subscriptionFromDocument),
      payments: (payments.documents || []).map(paymentFromDocument),
      meta: {
        planCount: plans.total || plans.documents?.length || 0,
        subscriptionCount: subscriptions.total || subscriptions.documents?.length || 0,
        paymentCount: payments.total || payments.documents?.length || 0,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load billing operations." },
      { status: 500 },
    );
  }
}
