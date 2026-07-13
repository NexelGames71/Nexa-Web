import {
  Account,
  AppwriteException,
  Client,
  Databases,
  Permission,
  Query,
  Role,
  Users,
} from "node-appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";

function defaultCollectionId(...parts) {
  return parts.join("_");
}

export const databaseId = process.env.APPWRITE_DATABASE_ID || "";
export const conversationsCollectionId =
  process.env.APPWRITE_CONVERSATIONS_COLLECTION_ID || "conversations";
export const messagesCollectionId = process.env.APPWRITE_MESSAGES_COLLECTION_ID || "messages";
export const userMemoryCollectionId = process.env.APPWRITE_USER_MEMORY_COLLECTION_ID || "user_memory";
export const userPreferencesCollectionId =
  process.env.APPWRITE_USER_PREFERENCES_COLLECTION_ID || "user_preferences";
export const trainingExportsCollectionId =
  process.env.APPWRITE_TRAINING_EXPORTS_COLLECTION_ID || "training_exports";
export const trainingExportFilesCollectionId =
  process.env.APPWRITE_TRAINING_EXPORT_FILES_COLLECTION_ID || "training_export_files";
export const generatedImagesCollectionId =
  process.env.APPWRITE_GENERATED_IMAGES_COLLECTION_ID || "";
export const storageAssetsCollectionId =
  process.env.APPWRITE_STORAGE_ASSETS_COLLECTION_ID || "";
export const storageUsageCollectionId =
  process.env.APPWRITE_STORAGE_USAGE_COLLECTION_ID || "";
export const planUsageCollectionId =
  process.env.APPWRITE_PLAN_USAGE_COLLECTION_ID || defaultCollectionId("plan", "usage");
export const imageGenerationJobsCollectionId =
  process.env.APPWRITE_IMAGE_GENERATION_JOBS_COLLECTION_ID ||
  defaultCollectionId("image", "generation", "jobs");
export const modelRegistryCollectionId =
  process.env.APPWRITE_MODEL_REGISTRY_COLLECTION_ID || defaultCollectionId("model", "registry");
export const modelUsageCollectionId =
  process.env.APPWRITE_MODEL_USAGE_COLLECTION_ID || defaultCollectionId("model", "usage");
export const billingPlansCollectionId =
  process.env.APPWRITE_BILLING_PLANS_COLLECTION_ID || defaultCollectionId("billing", "plans");
export const subscriptionsCollectionId =
  process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || defaultCollectionId("billing", "subscriptions");
export const paymentsCollectionId =
  process.env.APPWRITE_PAYMENTS_COLLECTION_ID || defaultCollectionId("billing", "payments");
export const supportTicketsCollectionId =
  process.env.APPWRITE_SUPPORT_TICKETS_COLLECTION_ID || defaultCollectionId("support", "tickets");
export const supportNotesCollectionId =
  process.env.APPWRITE_SUPPORT_NOTES_COLLECTION_ID || defaultCollectionId("support", "notes");
export const adminAuditLogsCollectionId =
  process.env.APPWRITE_ADMIN_AUDIT_LOGS_COLLECTION_ID ||
  defaultCollectionId("admin", "audit", "logs");
export const promotionsCollectionId =
  process.env.APPWRITE_PROMOTIONS_COLLECTION_ID || defaultCollectionId("promotions");
export const promotionRewardsCollectionId =
  process.env.APPWRITE_PROMOTION_REWARDS_COLLECTION_ID || defaultCollectionId("promotion", "rewards");
export const promotionEligibilityRulesCollectionId =
  process.env.APPWRITE_PROMOTION_ELIGIBILITY_RULES_COLLECTION_ID ||
  defaultCollectionId("promotion", "eligibility", "rules");
export const promotionLimitsCollectionId =
  process.env.APPWRITE_PROMOTION_LIMITS_COLLECTION_ID || defaultCollectionId("promotion", "limits");
export const promotionSchedulesCollectionId =
  process.env.APPWRITE_PROMOTION_SCHEDULES_COLLECTION_ID || defaultCollectionId("promotion", "schedules");
export const promotionCodesCollectionId =
  process.env.APPWRITE_PROMOTION_CODES_COLLECTION_ID || defaultCollectionId("promotion", "codes");
export const promotionAssignmentsCollectionId =
  process.env.APPWRITE_PROMOTION_ASSIGNMENTS_COLLECTION_ID ||
  defaultCollectionId("promotion", "assignments");
export const promotionRedemptionsCollectionId =
  process.env.APPWRITE_PROMOTION_REDEMPTIONS_COLLECTION_ID ||
  defaultCollectionId("promotion", "redemptions");
export const promotionUsageEventsCollectionId =
  process.env.APPWRITE_PROMOTION_USAGE_EVENTS_COLLECTION_ID ||
  defaultCollectionId("promotion", "usage", "events");
export const promotionAuditLogsCollectionId =
  process.env.APPWRITE_PROMOTION_AUDIT_LOGS_COLLECTION_ID ||
  defaultCollectionId("promotion", "audit", "logs");
export const promotionExperimentsCollectionId =
  process.env.APPWRITE_PROMOTION_EXPERIMENTS_COLLECTION_ID ||
  defaultCollectionId("promotion", "experiments");
export const referralCampaignsCollectionId =
  process.env.APPWRITE_REFERRAL_CAMPAIGNS_COLLECTION_ID || defaultCollectionId("referral", "campaigns");
export const referralRelationshipsCollectionId =
  process.env.APPWRITE_REFERRAL_RELATIONSHIPS_COLLECTION_ID ||
  defaultCollectionId("referral", "relationships");

function createBaseClient() {
  if (!project) {
    throw new Error("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID.");
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(project);
  return client;
}

export function ensureMemoryConfig() {
  const missing = [];

  if (!apiKey) missing.push("APPWRITE_API_KEY");
  if (!databaseId) missing.push("APPWRITE_DATABASE_ID");
  if (!conversationsCollectionId) missing.push("APPWRITE_CONVERSATIONS_COLLECTION_ID");
  if (!messagesCollectionId) missing.push("APPWRITE_MESSAGES_COLLECTION_ID");
  if (!userMemoryCollectionId) missing.push("APPWRITE_USER_MEMORY_COLLECTION_ID");
  if (!userPreferencesCollectionId) missing.push("APPWRITE_USER_PREFERENCES_COLLECTION_ID");
  if (!trainingExportsCollectionId) missing.push("APPWRITE_TRAINING_EXPORTS_COLLECTION_ID");
  if (!trainingExportFilesCollectionId) {
    missing.push("APPWRITE_TRAINING_EXPORT_FILES_COLLECTION_ID");
  }

  if (missing.length > 0) {
    throw new Error(`Missing Appwrite memory config: ${missing.join(", ")}`);
  }
}

export function createAdminDatabases() {
  ensureMemoryConfig();
  const client = createBaseClient();
  client.setKey(apiKey);
  return new Databases(client);
}

export function createAdminUsers() {
  ensureMemoryConfig();
  const client = createBaseClient();
  client.setKey(apiKey);
  return new Users(client);
}

export function createUserAccount(jwt) {
  const client = createBaseClient();
  client.setJWT(jwt);
  return new Account(client);
}

export async function requireUserFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  const jwt = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!jwt) {
    return { error: "Missing authorization token.", status: 401 };
  }

  try {
    const account = createUserAccount(jwt);
    const user = await account.get();
    return { jwt, user };
  } catch (error) {
    const message =
      error instanceof AppwriteException ? error.message : "Authentication failed.";
    return { error: message, status: 401 };
  }
}

export function isAdminUser(user) {
  const [localPart] = String(user?.email || "").trim().toLowerCase().split("@");
  return localPart.startsWith("admin.");
}

export async function requireAdminFromRequest(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return auth;
  }

  if (!isAdminUser(auth.user)) {
    return { error: "Admin access required.", status: 403 };
  }

  return auth;
}

export function ownerPermissions(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

export function ownerQueries(userId, limit = 100) {
  return [Query.equal("userId", userId), Query.orderDesc("updatedAt"), Query.limit(limit)];
}
