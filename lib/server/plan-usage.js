import { AppwriteException } from "node-appwrite";
import { createHash } from "crypto";

import { BILLING_PLANS } from "../billing-plans";
import {
  METRIC_LIMIT_CONFIG,
  PLAN_USAGE_STATES,
  getMetricLimit,
  usageState,
} from "../plan-limits";
import {
  createAdminDatabases,
  databaseId,
  ownerPermissions,
  planUsageCollectionId,
} from "./appwrite";
import { getBillingProfileForUser } from "./billing";

function nowIso() {
  return new Date().toISOString();
}

function isNotFound(error) {
  return error instanceof AppwriteException && Number(error.code) === 404;
}

function periodStart(periodType, date = new Date()) {
  if (periodType === "day") {
    return date.toISOString().slice(0, 10);
  }
  if (periodType === "month") {
    return date.toISOString().slice(0, 7);
  }
  return "all";
}

function resetAt(periodType, date = new Date()) {
  if (periodType === "day") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)).toISOString();
  }
  if (periodType === "month") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString();
  }
  return "";
}

function usageDocumentId(userId, metric, periodType, start) {
  const source = `${userId}:${metric}:${periodType}:${start}`;
  return `usage_${createHash("sha256").update(source).digest("hex").slice(0, 30)}`;
}

async function getUsageDocument({ userId, metric, periodType, start }) {
  if (!planUsageCollectionId) {
    return null;
  }

  const databases = createAdminDatabases();
  try {
    return await databases.getDocument(
      databaseId,
      planUsageCollectionId,
      usageDocumentId(userId, metric, periodType, start),
    );
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

function nextUpgradePlan(currentPlanId, metric, periodType, currentLimit) {
  const order = ["starter", "plus", "pro", "premium", "business", "enterprise"];
  const currentIndex = order.indexOf(String(currentPlanId || "starter"));
  const candidates = order.slice(Math.max(0, currentIndex + 1));

  for (const planId of candidates) {
    if (planId === "enterprise") {
      const plan = BILLING_PLANS.find((item) => item.id === planId);
      return plan ? { id: plan.id, name: plan.name } : null;
    }
    const limit = getMetricLimit(planId, metric, periodType);
    if (limit === null || Number(limit) > Number(currentLimit || 0)) {
      const plan = BILLING_PLANS.find((item) => item.id === planId);
      return plan ? { id: plan.id, name: plan.name } : null;
    }
  }

  return null;
}

function cappedResult({ metric, plan, periodType, start, used, limit, amount }) {
  return {
    allowed: false,
    code: "plan_limit_reached",
    metric,
    plan,
    periodType,
    periodStart: start,
    used,
    limit,
    amount,
    status: PLAN_USAGE_STATES.CAPPED,
    resetAt: resetAt(periodType),
    upgradePlan: nextUpgradePlan(plan.id, metric, periodType, limit),
  };
}

function allowedResult({ metric, plan, periodType, start, used, limit, amount, status }) {
  return {
    allowed: true,
    metric,
    plan,
    periodType,
    periodStart: start,
    used,
    limit,
    amount,
    status,
    resetAt: resetAt(periodType),
    upgradePlan:
      status === PLAN_USAGE_STATES.WARNING
        ? nextUpgradePlan(plan.id, metric, periodType, limit)
        : null,
  };
}

export function planLimitResponse(result, status = 429) {
  return Response.json(
    {
      error: "Plan limit reached.",
      code: result.code || "plan_limit_reached",
      metric: result.metric,
      plan: result.plan,
      used: result.used,
      limit: result.limit,
      resetAt: result.resetAt,
      upgradePlan: result.upgradePlan,
    },
    { status },
  );
}

export async function checkPlanLimit(userId, metric, amount = 1) {
  const billingProfile = await getBillingProfileForUser(userId);
  const plan = {
    id: billingProfile.plan || "starter",
    name: billingProfile.planName || "Starter",
  };
  const config = METRIC_LIMIT_CONFIG[metric];

  if (!config) {
    return allowedResult({
      metric,
      plan,
      periodType: "all_time",
      start: "all",
      used: 0,
      limit: null,
      amount,
      status: PLAN_USAGE_STATES.NORMAL,
    });
  }

  let strongestAllowed = null;
  for (const periodType of config.periodTypes) {
    const limit = getMetricLimit(plan.id, metric, periodType);
    if (limit === null || limit < 0) {
      continue;
    }

    const start = periodStart(periodType);
    let currentUsed = 0;
    try {
      const current = await getUsageDocument({ userId, metric, periodType, start });
      currentUsed = Number(current?.used || 0);
    } catch (error) {
      console.warn("Plan usage check unavailable:", error?.message || error);
      continue;
    }

    if (currentUsed + amount > limit) {
      return cappedResult({
        metric,
        plan,
        periodType,
        start,
        used: currentUsed,
        limit,
        amount,
      });
    }

    const nextStatus = usageState(currentUsed + amount, limit);
    const result = allowedResult({
      metric,
      plan,
      periodType,
      start,
      used: currentUsed,
      limit,
      amount,
      status: nextStatus,
    });

    if (!strongestAllowed || result.status === PLAN_USAGE_STATES.WARNING) {
      strongestAllowed = result;
    }
  }

  return (
    strongestAllowed ||
    allowedResult({
      metric,
      plan,
      periodType: "all_time",
      start: "all",
      used: 0,
      limit: null,
      amount,
      status: PLAN_USAGE_STATES.NORMAL,
    })
  );
}

export async function recordPlanUsage(userId, metric, amount = 1) {
  if (!planUsageCollectionId || !userId || !metric || !amount) {
    return [];
  }

  const billingProfile = await getBillingProfileForUser(userId);
  const planId = billingProfile.plan || "starter";
  const config = METRIC_LIMIT_CONFIG[metric];
  if (!config) {
    return [];
  }

  const databases = createAdminDatabases();
  const now = nowIso();
  const updates = [];

  for (const periodType of config.periodTypes) {
    const limit = getMetricLimit(planId, metric, periodType);
    if (limit === null || limit < 0) {
      continue;
    }

    const start = periodStart(periodType);
    const documentId = usageDocumentId(userId, metric, periodType, start);
    const reset = resetAt(periodType);

    try {
      const current = await databases.getDocument(databaseId, planUsageCollectionId, documentId);
      const used = Number(current.used || 0) + amount;
      const status = usageState(used, limit);
      updates.push(
        await databases.updateDocument(
          databaseId,
          planUsageCollectionId,
          documentId,
          {
            planId,
            used,
            limit,
            status,
            resetAt: reset,
            updatedAt: now,
          },
          ownerPermissions(userId),
        ),
      );
    } catch (error) {
      if (!isNotFound(error)) {
        console.warn("Plan usage record failed:", error?.message || error);
        continue;
      }

      try {
        updates.push(
          await databases.createDocument(
            databaseId,
            planUsageCollectionId,
            documentId,
            {
              userId,
              tenantId: "personal",
              planId,
              metric,
              periodType,
              periodStart: start,
              used: amount,
              limit,
              status: usageState(amount, limit),
              resetAt: reset,
              createdAt: now,
              updatedAt: now,
            },
            ownerPermissions(userId),
          ),
        );
      } catch (createError) {
        console.warn("Plan usage create failed:", createError?.message || createError);
      }
    }
  }

  return updates;
}

export async function setPlanUsage(userId, metric, usedValue = 0) {
  if (!planUsageCollectionId || !userId || !metric) {
    return null;
  }

  const billingProfile = await getBillingProfileForUser(userId);
  const planId = billingProfile.plan || "starter";
  const config = METRIC_LIMIT_CONFIG[metric];
  if (!config) {
    return null;
  }

  const periodType = config.periodTypes.includes("all_time") ? "all_time" : config.periodTypes[0];
  const limit = getMetricLimit(planId, metric, periodType);
  if (limit === null || limit < 0) {
    return null;
  }

  const databases = createAdminDatabases();
  const now = nowIso();
  const start = periodStart(periodType);
  const documentId = usageDocumentId(userId, metric, periodType, start);
  const used = Number(usedValue || 0);
  const payload = {
    userId,
    tenantId: "personal",
    planId,
    metric,
    periodType,
    periodStart: start,
    used,
    limit,
    status: usageState(used, limit),
    resetAt: resetAt(periodType),
    updatedAt: now,
  };

  try {
    await databases.getDocument(databaseId, planUsageCollectionId, documentId);
    return databases.updateDocument(databaseId, planUsageCollectionId, documentId, payload, ownerPermissions(userId));
  } catch (error) {
    if (!isNotFound(error)) {
      console.warn("Plan usage set failed:", error?.message || error);
      return null;
    }

    try {
      return databases.createDocument(
        databaseId,
        planUsageCollectionId,
        documentId,
        {
          ...payload,
          createdAt: now,
        },
        ownerPermissions(userId),
      );
    } catch (createError) {
      console.warn("Plan usage set create failed:", createError?.message || createError);
      return null;
    }
  }
}

export async function checkAbsolutePlanLimit(userId, metric, usedValue = 0) {
  const billingProfile = await getBillingProfileForUser(userId);
  const plan = {
    id: billingProfile.plan || "starter",
    name: billingProfile.planName || "Starter",
  };
  const config = METRIC_LIMIT_CONFIG[metric];
  const periodType = config?.periodTypes?.includes("all_time") ? "all_time" : config?.periodTypes?.[0] || "all_time";
  const limit = getMetricLimit(plan.id, metric, periodType);
  if (limit !== null && limit >= 0 && Number(usedValue || 0) > limit) {
    return cappedResult({
      metric,
      plan,
      periodType,
      start: periodStart(periodType),
      used: Number(usedValue || 0),
      limit,
      amount: 0,
    });
  }

  return allowedResult({
    metric,
    plan,
    periodType,
    start: periodStart(periodType),
    used: Number(usedValue || 0),
    limit,
    amount: 0,
    status: usageState(Number(usedValue || 0), limit),
  });
}

export async function getUsageSummary(userId) {
  const billingProfile = await getBillingProfileForUser(userId);
  const plan = {
    id: billingProfile.plan || "starter",
    name: billingProfile.planName || "Starter",
  };
  const items = [];

  for (const [metric, config] of Object.entries(METRIC_LIMIT_CONFIG)) {
    for (const periodType of config.periodTypes) {
      const limit = getMetricLimit(plan.id, metric, periodType);
      if (limit === null || limit < 0) {
        continue;
      }

      const start = periodStart(periodType);
      let used = 0;
      try {
        const current = await getUsageDocument({ userId, metric, periodType, start });
        used = Number(current?.used || 0);
      } catch (error) {
        console.warn("Plan usage summary unavailable:", error?.message || error);
      }

      items.push({
        metric,
        periodType,
        periodStart: start,
        used,
        limit,
        status: usageState(used, limit),
        resetAt: resetAt(periodType),
        upgradePlan: nextUpgradePlan(plan.id, metric, periodType, limit),
      });
    }
  }

  return {
    plan,
    items,
  };
}
