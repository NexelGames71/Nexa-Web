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
    // Allow pure shell env usage if .env.local is missing.
  }
}

await loadEnvFile();

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";

const databaseId = process.env.APPWRITE_DATABASE_ID || "nexa_memory";
const conversationsCollectionId =
  process.env.APPWRITE_CONVERSATIONS_COLLECTION_ID || "conversations";
const messagesCollectionId = process.env.APPWRITE_MESSAGES_COLLECTION_ID || "messages";
const userMemoryCollectionId = process.env.APPWRITE_USER_MEMORY_COLLECTION_ID || "user_memory";
const userPreferencesCollectionId =
  process.env.APPWRITE_USER_PREFERENCES_COLLECTION_ID || "user_preferences";
const trainingExportsCollectionId =
  process.env.APPWRITE_TRAINING_EXPORTS_COLLECTION_ID || "training_exports";
const trainingExportFilesCollectionId =
  process.env.APPWRITE_TRAINING_EXPORT_FILES_COLLECTION_ID || "training_export_files";

const responseFormat = "1.9.5";
const pollIntervalMs = 1500;
const pollTimeoutMs = 60_000;

const collections = [
  {
    id: conversationsCollectionId,
    name: "Conversations",
    attributes: [
      { key: "userId", type: "varchar", size: 64, required: true, array: false },
      { key: "title", type: "varchar", size: 120, required: true, array: false },
      { key: "createdAt", type: "varchar", size: 64, required: true, array: false },
      { key: "updatedAt", type: "varchar", size: 64, required: true, array: false },
      { key: "lastMessagePreview", type: "varchar", size: 255, required: true, array: false },
      { key: "archived", type: "varchar", size: 8, required: false, array: false },
      { key: "archivedAt", type: "varchar", size: 64, required: false, array: false },
    ],
    indexes: [
      {
        key: "userId_updatedAt",
        type: "key",
        attributes: ["userId", "updatedAt"],
        orders: ["ASC", "DESC"],
        lengths: [],
      },
    ],
  },
  {
    id: messagesCollectionId,
    name: "Messages",
    attributes: [
      { key: "conversationId", type: "varchar", size: 64, required: true, array: false },
      { key: "userId", type: "varchar", size: 64, required: true, array: false },
      { key: "role", type: "varchar", size: 32, required: true, array: false },
      { key: "content", type: "varchar", size: 10000, required: true, array: false },
      { key: "createdAt", type: "varchar", size: 64, required: true, array: false },
    ],
    indexes: [
      {
        key: "conversation_createdAt",
        type: "key",
        attributes: ["conversationId", "createdAt"],
        orders: ["ASC", "ASC"],
        lengths: [],
      },
      {
        key: "userId",
        type: "key",
        attributes: ["userId"],
        orders: ["ASC"],
        lengths: [],
      },
    ],
  },
  {
    id: userMemoryCollectionId,
    name: "User Memory",
    attributes: [
      { key: "userId", type: "varchar", size: 64, required: true, array: false },
      { key: "displayName", type: "varchar", size: 120, required: true, array: false },
      { key: "preferredTone", type: "varchar", size: 120, required: true, array: false },
      { key: "interests", type: "varchar", size: 120, required: true, array: true },
      { key: "customInstructions", type: "varchar", size: 5000, required: true, array: false },
      { key: "facts", type: "varchar", size: 255, required: true, array: true },
      { key: "updatedAt", type: "varchar", size: 64, required: true, array: false },
    ],
    indexes: [
      {
        key: "userId_unique",
        type: "unique",
        attributes: ["userId"],
        orders: ["ASC"],
        lengths: [],
      },
    ],
  },
  {
    id: userPreferencesCollectionId,
    name: "User Preferences",
    attributes: [
      { key: "userId", type: "varchar", size: 64, required: true, array: false },
      { key: "improveModelForEveryone", type: "varchar", size: 8, required: true, array: false },
      { key: "updatedAt", type: "varchar", size: 64, required: true, array: false },
      { key: "lastExportAt", type: "varchar", size: 64, required: false, array: false },
      { key: "lastArchiveAllAt", type: "varchar", size: 64, required: false, array: false },
      { key: "lastDeleteAllAt", type: "varchar", size: 64, required: false, array: false },
      { key: "trainingOptInAt", type: "varchar", size: 64, required: false, array: false },
      { key: "trainingOptOutAt", type: "varchar", size: 64, required: false, array: false },
    ],
    indexes: [
      {
        key: "userId_unique",
        type: "unique",
        attributes: ["userId"],
        orders: ["ASC"],
        lengths: [],
      },
    ],
  },
  {
    id: trainingExportsCollectionId,
    name: "Training Exports",
    attributes: [
      { key: "status", type: "varchar", size: 32, required: true, array: false },
      { key: "mode", type: "varchar", size: 32, required: true, array: false },
      { key: "exportName", type: "varchar", size: 255, required: true, array: false },
      { key: "scope", type: "varchar", size: 32, required: true, array: false },
      { key: "totalOptedInUsers", type: "integer", required: false, array: false },
      { key: "totalEligibleConversations", type: "integer", required: false, array: false },
      { key: "totalEligibleMessages", type: "integer", required: false, array: false },
      { key: "totalExamples", type: "integer", required: false, array: false },
      { key: "totalFiles", type: "integer", required: false, array: false },
      { key: "startedAt", type: "varchar", size: 64, required: true, array: false },
      { key: "completedAt", type: "varchar", size: 64, required: false, array: false },
      { key: "failedAt", type: "varchar", size: 64, required: false, array: false },
      { key: "lastMessageCreatedAtIncluded", type: "varchar", size: 64, required: false, array: false },
      { key: "r2Prefix", type: "varchar", size: 255, required: false, array: false },
      { key: "errorMessage", type: "varchar", size: 5000, required: false, array: false },
    ],
    indexes: [
      {
        key: "startedAt_desc",
        type: "key",
        attributes: ["startedAt"],
        orders: ["DESC"],
        lengths: [],
      },
      {
        key: "status_startedAt",
        type: "key",
        attributes: ["status", "startedAt"],
        orders: ["ASC", "DESC"],
        lengths: [],
      },
    ],
  },
  {
    id: trainingExportFilesCollectionId,
    name: "Training Export Files",
    attributes: [
      { key: "exportId", type: "varchar", size: 64, required: true, array: false },
      { key: "partNumber", type: "integer", required: true, array: false },
      { key: "fileName", type: "varchar", size: 255, required: true, array: false },
      { key: "objectKey", type: "varchar", size: 500, required: true, array: false },
      { key: "exampleCount", type: "integer", required: false, array: false },
      { key: "fileSizeBytes", type: "integer", required: false, array: false },
      { key: "createdAt", type: "varchar", size: 64, required: true, array: false },
    ],
    indexes: [
      {
        key: "exportId_partNumber",
        type: "key",
        attributes: ["exportId", "partNumber"],
        orders: ["ASC", "ASC"],
        lengths: [],
      },
    ],
  },
];

function assertConfig() {
  const missing = [];
  if (!projectId) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  if (!apiKey) missing.push("APPWRITE_API_KEY");

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

async function ensureDatabase() {
  const existing = await exists(`/databases/${databaseId}`);
  if (existing) {
    console.log(`Database exists: ${databaseId}`);
    return existing;
  }

  console.log(`Creating database: ${databaseId}`);
  return request("POST", "/databases", {
    databaseId,
    name: "Nexa Memory",
    enabled: true,
  });
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
        `Attribute ${collectionId}.${key} failed to become available: ${attribute.error || "unknown error"}`,
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
      throw new Error(
        `Index ${collectionId}.${key} failed to become available: ${index.error || "unknown error"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for index ${collectionId}.${key}`);
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
    {
      key: attribute.key,
      size: attribute.size,
      required: attribute.required,
      array: attribute.array,
      encrypt: false,
    },
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
    lengths: index.lengths,
  });

  return waitForIndex(collectionId, index.key);
}

async function writeGeneratedEnv() {
  const output = [
    `NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}`,
    `NEXT_PUBLIC_APPWRITE_ENDPOINT=${endpoint}`,
    `NEXT_PUBLIC_APPWRITE_PROJECT_ID=${projectId}`,
    `APPWRITE_API_KEY=${apiKey || "replace_with_server_key"}`,
    `APPWRITE_DATABASE_ID=${databaseId}`,
    `APPWRITE_CONVERSATIONS_COLLECTION_ID=${conversationsCollectionId}`,
    `APPWRITE_MESSAGES_COLLECTION_ID=${messagesCollectionId}`,
    `APPWRITE_USER_MEMORY_COLLECTION_ID=${userMemoryCollectionId}`,
    `APPWRITE_USER_PREFERENCES_COLLECTION_ID=${userPreferencesCollectionId}`,
    `APPWRITE_TRAINING_EXPORTS_COLLECTION_ID=${trainingExportsCollectionId}`,
    `APPWRITE_TRAINING_EXPORT_FILES_COLLECTION_ID=${trainingExportFilesCollectionId}`,
    "",
  ].join("\n");

  const targetPath = path.resolve(process.cwd(), ".env.local.generated");
  await fs.writeFile(targetPath, output, "utf8");
  console.log(`Wrote generated env file: ${targetPath}`);
}

async function main() {
  assertConfig();
  await ensureDatabase();

  for (const collection of collections) {
    await ensureCollection(collection);

    for (const attribute of collection.attributes) {
      await ensureAttribute(collection.id, attribute);
    }

    for (const index of collection.indexes) {
      await ensureIndex(collection.id, index);
    }
  }

  await writeGeneratedEnv();

  console.log("");
  console.log("Appwrite memory setup complete.");
  console.log(`Database: ${databaseId}`);
  console.log(
    `Collections: ${conversationsCollectionId}, ${messagesCollectionId}, ${userMemoryCollectionId}, ${userPreferencesCollectionId}`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
