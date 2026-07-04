import fs from "node:fs/promises";
import path from "node:path";

async function loadEnvFile() {
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (key && !(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Shell-provided env is enough in CI.
  }
}

await loadEnvFile();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";
const databaseId = process.env.APPWRITE_DATABASE_ID || "";
const responseFormat = "1.9.5";
const pollIntervalMs = 1500;
const pollTimeoutMs = 60_000;

function defaultCollectionId(...parts) {
  return parts.join("_");
}

const collectionIds = {
  modelRegistry:
    process.env.APPWRITE_MODEL_REGISTRY_COLLECTION_ID || defaultCollectionId("model", "registry"),
  modelUsage: process.env.APPWRITE_MODEL_USAGE_COLLECTION_ID || defaultCollectionId("model", "usage"),
  billingPlans:
    process.env.APPWRITE_BILLING_PLANS_COLLECTION_ID || defaultCollectionId("billing", "plans"),
  planUsage: process.env.APPWRITE_PLAN_USAGE_COLLECTION_ID || defaultCollectionId("plan", "usage"),
  subscriptions:
    process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || defaultCollectionId("billing", "subscriptions"),
  payments:
    process.env.APPWRITE_PAYMENTS_COLLECTION_ID || defaultCollectionId("billing", "payments"),
  supportTickets:
    process.env.APPWRITE_SUPPORT_TICKETS_COLLECTION_ID || defaultCollectionId("support", "tickets"),
  supportNotes:
    process.env.APPWRITE_SUPPORT_NOTES_COLLECTION_ID || defaultCollectionId("support", "notes"),
  adminAuditLogs:
    process.env.APPWRITE_ADMIN_AUDIT_LOGS_COLLECTION_ID || defaultCollectionId("admin", "audit", "logs"),
};

const collections = [
  {
    id: collectionIds.modelRegistry,
    name: "Model Registry",
    attributes: [
      varchar("modelId", 80, true),
      varchar("name", 160, true),
      varchar("type", 80, true),
      varchar("provider", 120, true),
      varchar("status", 32, true),
      varchar("version", 80, false),
      integer("contextWindow", false),
      integer("maxOutputTokens", false),
      varchar("endpoint", 500, false),
      float("defaultTemperature", false),
      varchar("planAccess", 2000, false),
      varchar("features", 2000, false),
      varchar("createdAt", 64, true),
      varchar("updatedAt", 64, true),
    ],
    indexes: [
      key("modelId_unique", "unique", ["modelId"]),
      key("type_status", "key", ["type", "status"]),
    ],
  },
  {
    id: collectionIds.modelUsage,
    name: "Model Usage",
    attributes: [
      varchar("modelId", 80, true),
      varchar("userId", 64, false),
      varchar("mode", 40, true),
      integer("requestCount", true),
      integer("inputTokens", false),
      integer("outputTokens", false),
      integer("latencyMs", false),
      integer("errorCount", false),
      float("costEstimate", false),
      varchar("createdAt", 64, true),
    ],
    indexes: [
      key("model_createdAt", "key", ["modelId", "createdAt"]),
      key("mode_createdAt", "key", ["mode", "createdAt"]),
    ],
  },
  {
    id: collectionIds.billingPlans,
    name: "Billing Plans",
    attributes: [
      varchar("planId", 80, true),
      varchar("name", 120, true),
      float("priceMonthly", false),
      float("priceYearly", false),
      varchar("currency", 8, true),
      varchar("paypalProductId", 160, false),
      varchar("paypalPlanId", 160, false),
      varchar("paypalSandboxProductId", 160, false),
      varchar("paypalSandboxPlanId", 160, false),
      varchar("paypalLiveProductId", 160, false),
      varchar("paypalLivePlanId", 160, false),
      varchar("limits", 4000, false),
      varchar("features", 1000, false),
      bool("isPublic", true),
      varchar("status", 32, true),
      varchar("createdAt", 64, true),
      varchar("updatedAt", 64, true),
    ],
    indexes: [
      key("planId_unique", "unique", ["planId"]),
      key("status_public", "key", ["status", "isPublic"]),
    ],
  },
  {
    id: collectionIds.planUsage,
    name: "Plan Usage",
    attributes: [
      varchar("userId", 64, true),
      varchar("tenantId", 64, true),
      varchar("planId", 80, true),
      varchar("metric", 80, true),
      varchar("periodType", 32, true),
      varchar("periodStart", 64, true),
      integer("used", true),
      integer("limit", false),
      varchar("status", 32, true),
      varchar("resetAt", 64, false),
      varchar("createdAt", 64, true),
      varchar("updatedAt", 64, true),
    ],
    indexes: [
      key("usage_unique", "unique", ["userId", "metric", "periodType", "periodStart"]),
      key("user_metric", "key", ["userId", "metric"]),
      key("status_updatedAt", "key", ["status", "updatedAt"]),
    ],
  },
  {
    id: collectionIds.subscriptions,
    name: "Subscriptions",
    attributes: [
      varchar("subscriptionId", 80, true),
      varchar("userId", 64, true),
      varchar("planId", 80, true),
      varchar("paypalSubscriptionId", 160, false),
      varchar("status", 40, true),
      varchar("currentPeriodStart", 64, false),
      varchar("currentPeriodEnd", 64, false),
      varchar("renewalDate", 64, false),
      varchar("cancelAt", 64, false),
      varchar("createdAt", 64, true),
      varchar("updatedAt", 64, true),
    ],
    indexes: [
      key("subscriptionId_unique", "unique", ["subscriptionId"]),
      key("user_status", "key", ["userId", "status"]),
      key("paypalSubscriptionId", "key", ["paypalSubscriptionId"]),
    ],
  },
  {
    id: collectionIds.payments,
    name: "Payments",
    attributes: [
      varchar("paymentId", 80, true),
      varchar("userId", 64, true),
      varchar("subscriptionId", 80, false),
      varchar("paypalTransactionId", 160, false),
      float("amount", true),
      varchar("currency", 8, true),
      varchar("status", 40, true),
      varchar("paidAt", 64, false),
      varchar("failureReason", 1000, false),
      varchar("createdAt", 64, true),
      varchar("updatedAt", 64, true),
    ],
    indexes: [
      key("paymentId_unique", "unique", ["paymentId"]),
      key("user_status", "key", ["userId", "status"]),
    ],
  },
  {
    id: collectionIds.supportTickets,
    name: "Support Tickets",
    attributes: [
      varchar("ticketId", 80, true),
      varchar("userId", 64, true),
      varchar("subject", 240, true),
      varchar("message", 4000, true),
      varchar("category", 40, true),
      varchar("priority", 40, true),
      varchar("status", 40, true),
      varchar("assignedAdminId", 64, false),
      varchar("createdAt", 64, true),
      varchar("updatedAt", 64, true),
      varchar("resolvedAt", 64, false),
    ],
    indexes: [
      key("ticketId_unique", "unique", ["ticketId"]),
      key("status_updatedAt", "key", ["status", "updatedAt"]),
      key("user_updatedAt", "key", ["userId", "updatedAt"]),
    ],
  },
  {
    id: collectionIds.supportNotes,
    name: "Support Notes",
    attributes: [
      varchar("noteId", 80, true),
      varchar("ticketId", 80, true),
      varchar("adminId", 64, true),
      varchar("note", 4000, true),
      varchar("visibility", 40, true),
      varchar("createdAt", 64, true),
    ],
    indexes: [
      key("noteId_unique", "unique", ["noteId"]),
      key("ticket_createdAt", "key", ["ticketId", "createdAt"]),
    ],
  },
  {
    id: collectionIds.adminAuditLogs,
    name: "Admin Audit Logs",
    attributes: [
      varchar("logId", 80, true),
      varchar("adminId", 64, true),
      varchar("action", 120, true),
      varchar("targetType", 80, true),
      varchar("targetId", 160, true),
      varchar("metadata", 4000, false),
      varchar("createdAt", 64, true),
    ],
    indexes: [
      key("logId_unique", "unique", ["logId"]),
      key("admin_createdAt", "key", ["adminId", "createdAt"]),
      key("target_createdAt", "key", ["targetType", "createdAt"]),
    ],
  },
];

function varchar(keyName, size, required) {
  return { key: keyName, type: "string", size, required };
}

function integer(keyName, required) {
  return { key: keyName, type: "integer", required };
}

function float(keyName, required) {
  return { key: keyName, type: "float", required };
}

function bool(keyName, required) {
  return { key: keyName, type: "boolean", required };
}

function key(keyName, type, attributes) {
  return { key: keyName, type, attributes, orders: attributes.map(() => "ASC") };
}

function assertConfig() {
  const missing = [];
  if (!projectId) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  if (!apiKey) missing.push("APPWRITE_API_KEY");
  if (!databaseId) missing.push("APPWRITE_DATABASE_ID");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

async function request(method, pathname, body) {
  const response = await fetch(`${endpoint}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Response-Format": responseFormat,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `${method} ${pathname} failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function exists(pathname) {
  try {
    return await request("GET", pathname);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function ensureCollection(collection) {
  const existing = await exists(`/databases/${databaseId}/collections/${collection.id}`);
  if (existing) {
    console.log(`Collection exists: ${collection.id}`);
    return;
  }
  console.log(`Creating collection: ${collection.id}`);
  await request("POST", `/databases/${databaseId}/collections`, {
    collectionId: collection.id,
    name: collection.name,
    permissions: [],
    documentSecurity: true,
    enabled: true,
  });
}

async function waitForAttribute(collectionId, keyName) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < pollTimeoutMs) {
    const attribute = await exists(`/databases/${databaseId}/collections/${collectionId}/attributes/${keyName}`);
    if (attribute?.status === "available") return;
    if (attribute?.status === "failed") throw new Error(`Attribute failed: ${collectionId}.${keyName}`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Timed out waiting for attribute ${collectionId}.${keyName}`);
}

async function ensureAttribute(collectionId, attribute) {
  const existing = await exists(`/databases/${databaseId}/collections/${collectionId}/attributes/${attribute.key}`);
  if (existing) {
    console.log(`Attribute exists: ${collectionId}.${attribute.key}`);
    return;
  }
  console.log(`Creating attribute: ${collectionId}.${attribute.key}`);
  const payload = {
    key: attribute.key,
    required: attribute.required,
    array: false,
    ...(attribute.size ? { size: attribute.size } : {}),
    ...(attribute.type === "string" ? { encrypt: false } : {}),
  };
  await request("POST", `/databases/${databaseId}/collections/${collectionId}/attributes/${attribute.type}`, payload);
  await waitForAttribute(collectionId, attribute.key);
}

async function ensureIndex(collectionId, index) {
  const existing = await exists(`/databases/${databaseId}/collections/${collectionId}/indexes/${index.key}`);
  if (existing) {
    console.log(`Index exists: ${collectionId}.${index.key}`);
    return;
  }
  console.log(`Creating index: ${collectionId}.${index.key}`);
  await request("POST", `/databases/${databaseId}/collections/${collectionId}/indexes`, {
    key: index.key,
    type: index.type,
    attributes: index.attributes,
    orders: index.orders,
  });
}

async function upsertGeneratedEnv() {
  const targetPath = path.resolve(process.cwd(), ".env.local.generated");
  let existing = "";
  try {
    existing = await fs.readFile(targetPath, "utf8");
  } catch {
    existing = "";
  }
  const values = new Map();
  for (const line of existing.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) continue;
    const [keyName, ...rest] = line.split("=");
    values.set(keyName.trim(), rest.join("=").trim());
  }
  for (const [keyName, value] of Object.entries(collectionIds)) {
    const envKey = `APPWRITE_${keyName.replace(/[A-Z]/g, (match) => `_${match}`).toUpperCase()}_COLLECTION_ID`;
    values.set(envKey, value);
  }
  const output = `${Array.from(values.entries()).map(([keyName, value]) => `${keyName}=${value}`).join("\n")}\n`;
  await fs.writeFile(targetPath, output, "utf8");
  console.log(`Wrote generated env file: ${targetPath}`);
}

async function main() {
  assertConfig();
  for (const collection of collections) {
    await ensureCollection(collection);
    for (const attribute of collection.attributes) {
      await ensureAttribute(collection.id, attribute);
    }
    for (const index of collection.indexes) {
      await ensureIndex(collection.id, index);
    }
  }
  await upsertGeneratedEnv();
  console.log("Appwrite admin operations setup complete.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
