import fs from "node:fs/promises";
import path from "node:path";

async function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");

  try {
    const raw = await fs.readFile(envPath, "utf8");

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Allow shell-provided env vars when .env.local is missing.
  }
}

await loadEnvFile();

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";
const databaseId = process.env.APPWRITE_DATABASE_ID || "";

function defaultCollectionId(...parts) {
  return parts.join("_");
}

const storageAssetsCollectionId =
  process.env.APPWRITE_STORAGE_ASSETS_COLLECTION_ID || defaultCollectionId("storage", "assets");
const generatedImagesCollectionId =
  process.env.APPWRITE_GENERATED_IMAGES_COLLECTION_ID || defaultCollectionId("generated", "images");
const storageUsageCollectionId =
  process.env.APPWRITE_STORAGE_USAGE_COLLECTION_ID || defaultCollectionId("storage", "usage");

const responseFormat = "1.9.5";
const pollIntervalMs = 1500;
const pollTimeoutMs = 60_000;

const collections = [
  {
    id: storageAssetsCollectionId,
    name: "Storage Assets",
    attributes: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "tenantId", type: "varchar", size: 64, required: true },
      { key: "assetType", type: "varchar", size: 32, required: true },
      { key: "category", type: "varchar", size: 32, required: true },
      { key: "filename", type: "varchar", size: 255, required: true },
      { key: "mimeType", type: "varchar", size: 120, required: true },
      { key: "sizeBytes", type: "integer", required: true },
      { key: "r2Bucket", type: "varchar", size: 255, required: true },
      { key: "r2Key", type: "varchar", size: 700, required: true },
      { key: "thumbnailKey", type: "varchar", size: 700, required: false },
      { key: "visibility", type: "varchar", size: 32, required: true },
      { key: "status", type: "varchar", size: 32, required: true },
      { key: "createdAt", type: "varchar", size: 64, required: true },
      { key: "updatedAt", type: "varchar", size: 64, required: true },
      { key: "deletedAt", type: "varchar", size: 64, required: false },
    ],
    indexes: [
      { key: "user_createdAt", type: "key", attributes: ["userId", "createdAt"], orders: ["ASC", "DESC"] },
      { key: "user_assetType", type: "key", attributes: ["userId", "assetType"], orders: ["ASC", "ASC"] },
      { key: "r2Key", type: "key", attributes: ["r2Key"], orders: ["ASC"] },
    ],
  },
  {
    id: generatedImagesCollectionId,
    name: "Generated Images",
    attributes: [
      { key: "assetId", type: "varchar", size: 64, required: true },
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "tenantId", type: "varchar", size: 64, required: true },
      { key: "conversationId", type: "varchar", size: 64, required: true },
      { key: "messageId", type: "varchar", size: 64, required: false },
      { key: "assetType", type: "varchar", size: 32, required: true },
      { key: "source", type: "varchar", size: 32, required: true },
      { key: "prompt", type: "varchar", size: 4000, required: true },
      { key: "revisedPrompt", type: "varchar", size: 4000, required: false },
      { key: "negativePrompt", type: "varchar", size: 2000, required: false },
      { key: "model", type: "varchar", size: 120, required: false },
      { key: "provider", type: "varchar", size: 80, required: false },
      { key: "steps", type: "integer", required: false },
      { key: "guidance", type: "float", required: false },
      { key: "seed", type: "integer", required: false },
      { key: "width", type: "integer", required: false },
      { key: "height", type: "integer", required: false },
      { key: "format", type: "varchar", size: 16, required: true },
      { key: "sizeBytes", type: "integer", required: false },
      { key: "r2Bucket", type: "varchar", size: 255, required: true },
      { key: "r2Key", type: "varchar", size: 700, required: true },
      { key: "thumbnailKey", type: "varchar", size: 700, required: false },
      { key: "imageUrl", type: "varchar", size: 2000, required: false },
      { key: "status", type: "varchar", size: 32, required: true },
      { key: "visibility", type: "varchar", size: 32, required: true },
      { key: "signedUrlRequired", type: "boolean", required: true },
      { key: "createdAt", type: "varchar", size: 64, required: true },
      { key: "updatedAt", type: "varchar", size: 64, required: true },
    ],
    indexes: [
      { key: "assetId", type: "key", attributes: ["assetId"], orders: ["ASC"] },
      { key: "user_createdAt", type: "key", attributes: ["userId", "createdAt"], orders: ["ASC", "DESC"] },
      { key: "conversation_createdAt", type: "key", attributes: ["conversationId", "createdAt"], orders: ["ASC", "DESC"] },
    ],
  },
  {
    id: storageUsageCollectionId,
    name: "Storage Usage",
    attributes: [
      { key: "userId", type: "varchar", size: 64, required: true },
      { key: "tenantId", type: "varchar", size: 64, required: true },
      { key: "plan", type: "varchar", size: 32, required: true },
      { key: "storageLimitBytes", type: "integer", required: true },
      { key: "storageUsedBytes", type: "integer", required: true },
      { key: "imagesUsedBytes", type: "integer", required: true },
      { key: "filesUsedBytes", type: "integer", required: true },
      { key: "memoryUsedBytes", type: "integer", required: true },
      { key: "audioUsedBytes", type: "integer", required: true },
      { key: "updatedAt", type: "varchar", size: 64, required: true },
    ],
    indexes: [
      { key: "userId_unique", type: "unique", attributes: ["userId"], orders: ["ASC"] },
      { key: "tenant_user", type: "key", attributes: ["tenantId", "userId"], orders: ["ASC", "ASC"] },
    ],
  },
];

function assertConfig() {
  const missing = [];
  if (!projectId) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  if (!apiKey) missing.push("APPWRITE_API_KEY");
  if (!databaseId) missing.push("APPWRITE_DATABASE_ID");

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
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

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || `${method} ${pathname} failed with ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function exists(pathname) {
  try {
    return await request("GET", pathname);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function ensureCollection(collection) {
  const existing = await exists(`/databases/${databaseId}/collections/${collection.id}`);
  if (existing) {
    console.log(`Collection exists: ${collection.id}`);
    return existing;
  }

  console.log(`Creating collection: ${collection.id}`);
  return request("POST", `/databases/${databaseId}/collections`, {
    collectionId: collection.id,
    name: collection.name,
    permissions: [],
    documentSecurity: true,
    enabled: true,
    attributes: [],
    indexes: [],
  });
}

async function waitForAttribute(collectionId, key) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < pollTimeoutMs) {
    const attribute = await exists(
      `/databases/${databaseId}/collections/${collectionId}/attributes/${key}`,
    );

    if (attribute?.status === "available") {
      return attribute;
    }

    if (attribute?.status === "failed") {
      throw new Error(
        `Attribute ${collectionId}.${key} failed: ${attribute.error || "unknown error"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for attribute ${collectionId}.${key}`);
}

async function waitForIndex(collectionId, key) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < pollTimeoutMs) {
    const index = await exists(`/databases/${databaseId}/collections/${collectionId}/indexes/${key}`);

    if (index?.status === "available") {
      return index;
    }

    if (index?.status === "failed") {
      throw new Error(`Index ${collectionId}.${key} failed: ${index.error || "unknown error"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for index ${collectionId}.${key}`);
}

function attributePayload(attribute) {
  const payload = {
    key: attribute.key,
    required: attribute.required,
    array: Boolean(attribute.array),
  };

  if (attribute.size) {
    payload.size = attribute.size;
  }

  if (attribute.type === "varchar") {
    payload.encrypt = false;
  }

  return payload;
}

async function ensureAttribute(collectionId, attribute) {
  const existing = await exists(
    `/databases/${databaseId}/collections/${collectionId}/attributes/${attribute.key}`,
  );
  if (existing) {
    console.log(`Attribute exists: ${collectionId}.${attribute.key}`);
    return existing;
  }

  console.log(`Creating attribute: ${collectionId}.${attribute.key}`);
  await request(
    "POST",
    `/databases/${databaseId}/collections/${collectionId}/attributes/${attribute.type}`,
    attributePayload(attribute),
  );

  return waitForAttribute(collectionId, attribute.key);
}

async function ensureIndex(collectionId, index) {
  const existing = await exists(`/databases/${databaseId}/collections/${collectionId}/indexes/${index.key}`);
  if (existing) {
    console.log(`Index exists: ${collectionId}.${index.key}`);
    return existing;
  }

  console.log(`Creating index: ${collectionId}.${index.key}`);
  await request("POST", `/databases/${databaseId}/collections/${collectionId}/indexes`, {
    key: index.key,
    type: index.type,
    attributes: index.attributes,
    orders: index.orders,
    lengths: index.lengths || [],
  });

  return waitForIndex(collectionId, index.key);
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
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }
    const [key, ...rest] = line.split("=");
    values.set(key.trim(), rest.join("=").trim());
  }

  values.set("APPWRITE_STORAGE_ASSETS_COLLECTION_ID", storageAssetsCollectionId);
  values.set("APPWRITE_GENERATED_IMAGES_COLLECTION_ID", generatedImagesCollectionId);
  values.set("APPWRITE_STORAGE_USAGE_COLLECTION_ID", storageUsageCollectionId);

  const output = `${Array.from(values.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;
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

  console.log("");
  console.log("Appwrite storage setup complete.");
  console.log(
    `Collections: ${storageAssetsCollectionId}, ${generatedImagesCollectionId}, ${storageUsageCollectionId}`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
