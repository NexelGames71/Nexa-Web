import { AppwriteException, ID, Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  promotionAuditLogsCollectionId,
  promotionCodesCollectionId,
  promotionEligibilityRulesCollectionId,
  promotionLimitsCollectionId,
  promotionRewardsCollectionId,
  promotionSchedulesCollectionId,
  promotionsCollectionId,
  requireAdminFromRequest,
} from "../../../../lib/server/appwrite";
import {
  APPLICATION_MODES,
  PROMOTION_STATUSES,
  PROMOTION_TYPES,
  REWARD_TYPES,
  STACKING_POLICIES,
  promotionCatalog,
} from "../../../../lib/promotions";

type PromotionPayload = {
  name?: string;
  title?: string;
  description?: string;
  terms?: string;
  internalNotes?: string;
  category?: string;
  promotionType?: string;
  applicationMode?: string;
  status?: string;
  code?: string;
  publicCampaign?: boolean;
  tags?: string[];
  priority?: number;
  stackingPolicy?: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  totalRedemptionLimit?: number;
  perUserLimit?: number;
  budgetLimit?: number;
  rewards?: any[];
  eligibilityRules?: any[];
  limits?: any[];
  schedule?: Record<string, any>;
  presentation?: Record<string, any>;
  abuseControls?: string[];
};

function parseJson(value: unknown, fallback: any) {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function normalizeCode(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function compactJson(value: unknown, maxLength = 1000) {
  const text = JSON.stringify(value || (Array.isArray(value) ? [] : {}));
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function truncate(value: unknown, maxLength: number) {
  const text = String(value || "");
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function safeStatus(value: unknown) {
  const next = String(value || "DRAFT").trim().toUpperCase();
  return (PROMOTION_STATUSES as readonly string[]).includes(next) ? next : "DRAFT";
}

function safeApplicationMode(value: unknown) {
  const next = String(value || "CODE").trim().toUpperCase();
  return (APPLICATION_MODES as readonly string[]).includes(next) ? next : "CODE";
}

function safePromotionType(value: unknown) {
  const next = String(value || "percentage_discount").trim();
  return PROMOTION_TYPES.some((type) => type.id === next) ? next : "percentage_discount";
}

function safeStackingPolicy(value: unknown) {
  const next = String(value || "NOT_STACKABLE").trim().toUpperCase();
  return (STACKING_POLICIES as readonly string[]).includes(next) ? next : "NOT_STACKABLE";
}

function promotionFromDocument(document: any) {
  return {
    id: document.promotionId || document.$id,
    name: document.name || "Untitled promotion",
    title: document.title || document.name || "Promotion",
    description: document.description || "",
    terms: document.terms || "",
    internalNotes: document.internalNotes || "",
    category: document.category || "",
    promotionType: document.promotionType || "percentage_discount",
    applicationMode: document.applicationMode || "CODE",
    status: document.status || "DRAFT",
    code: document.code || "",
    normalizedCode: document.normalizedCode || normalizeCode(document.code),
    publicCampaign: Boolean(document.publicCampaign),
    tags: parseJson(document.tags, []),
    priority: Number(document.priority || 0),
    stackingPolicy: document.stackingPolicy || "NOT_STACKABLE",
    startsAt: document.startsAt || "",
    endsAt: document.endsAt || "",
    timezone: document.timezone || "UTC",
    totalRedemptionLimit: Number(document.totalRedemptionLimit || 0),
    perUserLimit: Number(document.perUserLimit || 1),
    budgetLimit: Number(document.budgetLimit || 0),
    revenueGenerated: Number(document.revenueGenerated || 0),
    discountValueGranted: Number(document.discountValueGranted || 0),
    creditsGranted: Number(document.creditsGranted || 0),
    redemptionCount: Number(document.redemptionCount || 0),
    uniqueUsersReached: Number(document.uniqueUsersReached || 0),
    conversionRate: Number(document.conversionRate || 0),
    promotionCost: Number(document.promotionCost || 0),
    rejectedAttempts: Number(document.rejectedAttempts || 0),
    createdBy: document.createdBy || "",
    createdAt: document.createdAt || document.$createdAt || "",
    updatedAt: document.updatedAt || document.$updatedAt || "",
    rewards: parseJson(document.rewardsSnapshot, []),
    eligibilityRules: parseJson(document.eligibilitySnapshot, []),
    limits: parseJson(document.limitsSnapshot, []),
    schedule: parseJson(document.scheduleSnapshot, {}),
    presentation: parseJson(document.presentationSnapshot, {}),
    abuseControls: parseJson(document.abuseControls, []),
  };
}

function isMissingCollection(error: any) {
  return error instanceof AppwriteException && [404, 400].includes(Number(error.code));
}

function dashboardFor(promotions: any[]) {
  const byStatus = (status: string) => promotions.filter((promotion) => promotion.status === status).length;
  const best = [...promotions].sort((a, b) => Number(b.redemptionCount || 0) - Number(a.redemptionCount || 0))[0] || null;

  return {
    totalActive: byStatus("ACTIVE"),
    scheduled: byStatus("SCHEDULED"),
    drafts: byStatus("DRAFT"),
    expired: byStatus("EXPIRED"),
    totalRedemptions: promotions.reduce((sum, promotion) => sum + Number(promotion.redemptionCount || 0), 0),
    uniqueUsersReached: promotions.reduce((sum, promotion) => sum + Number(promotion.uniqueUsersReached || 0), 0),
    discountValueGranted: promotions.reduce((sum, promotion) => sum + Number(promotion.discountValueGranted || 0), 0),
    creditsGranted: promotions.reduce((sum, promotion) => sum + Number(promotion.creditsGranted || 0), 0),
    promotionRevenue: promotions.reduce((sum, promotion) => sum + Number(promotion.revenueGenerated || 0), 0),
    promotionCost: promotions.reduce((sum, promotion) => sum + Number(promotion.promotionCost || 0), 0),
    rejectedAttempts: promotions.reduce((sum, promotion) => sum + Number(promotion.rejectedAttempts || 0), 0),
    conversionRate: promotions.length
      ? Number((promotions.reduce((sum, promotion) => sum + Number(promotion.conversionRate || 0), 0) / promotions.length).toFixed(2))
      : 0,
    bestPerformingPromotion: best?.name || "",
  };
}

async function createChildDocuments(databases: any, promotionId: string, payload: PromotionPayload, createdBy: string) {
  const now = new Date().toISOString();
  const writes: Promise<any>[] = [];

  for (const reward of payload.rewards || []) {
    writes.push(databases.createDocument(databaseId, promotionRewardsCollectionId, ID.unique(), {
      promotionId,
      rewardType: String(reward.rewardType || reward.type || REWARD_TYPES[0]),
      value: truncate(reward.value ?? "", 500),
      config: compactJson(reward, 2000),
      createdAt: now,
      updatedAt: now,
    }));
  }

  for (const rule of payload.eligibilityRules || []) {
    writes.push(databases.createDocument(databaseId, promotionEligibilityRulesCollectionId, ID.unique(), {
      promotionId,
      ruleType: String(rule.ruleType || rule.type || "ALL_USERS"),
      operator: String(rule.operator || "MATCHES"),
      value: truncate(rule.value ?? "", 1000),
      config: compactJson(rule, 2000),
      createdAt: now,
      updatedAt: now,
    }));
  }

  for (const limit of payload.limits || []) {
    writes.push(databases.createDocument(databaseId, promotionLimitsCollectionId, ID.unique(), {
      promotionId,
      limitType: String(limit.limitType || limit.type || "TOTAL_REDEMPTIONS"),
      value: Number(limit.value || 0),
      config: compactJson(limit, 2000),
      createdAt: now,
      updatedAt: now,
    }));
  }

  if (payload.schedule) {
    writes.push(databases.createDocument(databaseId, promotionSchedulesCollectionId, ID.unique(), {
      promotionId,
      startsAt: payload.startsAt || "",
      endsAt: payload.endsAt || "",
      timezone: payload.timezone || "UTC",
      config: compactJson(payload.schedule, 2000),
      createdAt: now,
      updatedAt: now,
    }));
  }

  if (payload.code) {
    writes.push(databases.createDocument(databaseId, promotionCodesCollectionId, ID.unique(), {
      promotionId,
      code: payload.code,
      normalizedCode: normalizeCode(payload.code),
      status: safeStatus(payload.status),
      createdAt: now,
      updatedAt: now,
    }));
  }

  writes.push(databases.createDocument(databaseId, promotionAuditLogsCollectionId, ID.unique(), {
    promotionId,
    action: "PROMOTION_CREATED",
    actorUserId: createdBy,
    riskScore: 0,
    rejectionReason: "",
    metadata: JSON.stringify({ source: "admin_promotions_page" }),
    createdAt: now,
  }));

  await Promise.allSettled(writes);
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const databases = createAdminDatabases();
    let promotions: any[] = [];
    let warning = "";

    try {
      const records = await databases.listDocuments(databaseId, promotionsCollectionId, [
        Query.orderDesc("updatedAt"),
        Query.limit(500),
      ]);
      promotions = (records.documents || []).map(promotionFromDocument);
    } catch (error: any) {
      if (!isMissingCollection(error)) {
        throw error;
      }
      warning = "Promotion collections are not configured yet. Showing reusable promotion building blocks only.";
    }

    return Response.json({
      catalog: promotionCatalog(),
      promotions,
      dashboard: dashboardFor(promotions),
      warning,
      requiredCollections: [
        "promotions",
        "promotion_rewards",
        "promotion_eligibility_rules",
        "promotion_limits",
        "promotion_schedules",
        "promotion_codes",
        "promotion_assignments",
        "promotion_redemptions",
        "promotion_usage_events",
        "promotion_audit_logs",
        "promotion_experiments",
        "referral_campaigns",
        "referral_relationships",
      ],
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load promotions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const body = (await request.json()) as PromotionPayload;
    const name = String(body.name || "").trim();
    if (!name) {
      return Response.json({ error: "Promotion name is required." }, { status: 400 });
    }

    const status = safeStatus(body.status);
    const applicationMode = safeApplicationMode(body.applicationMode);
    const promotionType = safePromotionType(body.promotionType);
    const code = normalizeCode(body.code);
    if (applicationMode === "CODE" && !code) {
      return Response.json({ error: "Promotion code is required for code-based campaigns." }, { status: 400 });
    }

    const databases = createAdminDatabases();
    if (code) {
      const existing = await databases.listDocuments(databaseId, promotionsCollectionId, [
        Query.equal("normalizedCode", code),
        Query.notEqual("status", "ARCHIVED"),
        Query.limit(1),
      ]);
      if ((existing.documents || []).length > 0) {
        return Response.json({ error: "Promotion code already exists on a non-archived campaign." }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const promotionId = ID.unique();
    const document = await databases.createDocument(databaseId, promotionsCollectionId, promotionId, {
      promotionId,
      name,
      title: String(body.title || name).trim(),
      description: truncate(String(body.description || "").trim(), 1000),
      category: String(body.category || PROMOTION_TYPES.find((type) => type.id === promotionType)?.category || ""),
      promotionType,
      applicationMode,
      status,
      code,
      normalizedCode: code,
      publicCampaign: Boolean(body.publicCampaign),
      priority: Number(body.priority || 0),
      stackingPolicy: safeStackingPolicy(body.stackingPolicy),
      startsAt: String(body.startsAt || ""),
      endsAt: String(body.endsAt || ""),
      timezone: String(body.timezone || "UTC"),
      totalRedemptionLimit: Number(body.totalRedemptionLimit || 0),
      perUserLimit: Number(body.perUserLimit || 1),
      budgetLimit: Number(body.budgetLimit || 0),
      redemptionCount: 0,
      uniqueUsersReached: 0,
      revenueGenerated: 0,
      discountValueGranted: 0,
      creditsGranted: 0,
      conversionRate: 0,
      promotionCost: 0,
      rejectedAttempts: 0,
      createdBy: (auth as any).user?.$id || "",
      createdAt: now,
      updatedAt: now,
    });

    await createChildDocuments(databases, promotionId, { ...body, code, status }, (auth as any).user?.$id || "");

    return Response.json({ promotion: promotionFromDocument(document) }, { status: 201 });
  } catch (error: any) {
    const status = isMissingCollection(error) ? 503 : 500;
    return Response.json(
      {
        error:
          status === 503
            ? "Promotion collections are not configured in Appwrite yet."
            : error?.message || "Failed to create promotion.",
      },
      { status },
    );
  }
}
