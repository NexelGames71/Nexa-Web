import { ID, Query } from "node-appwrite";

import {
  conversationsCollectionId,
  createAdminDatabases,
  createAdminUsers,
  databaseId,
  messagesCollectionId,
  trainingExportFilesCollectionId,
  trainingExportsCollectionId,
  userPreferencesCollectionId,
} from "./appwrite";
import { createSignedDownloadUrl, uploadR2Object } from "./r2";

const PAGE_SIZE = 100;
const USER_BATCH_SIZE = 25;
const EXPORT_PART_SIZE = Number(process.env.TRAINING_EXPORT_PART_SIZE || 10000);
const TRAINING_EXPORT_PREFIX = process.env.TRAINING_EXPORT_PREFIX || "training-exports";

function chunk(values, size) {
  const items = [];

  for (let index = 0; index < values.length; index += size) {
    items.push(values.slice(index, index + size));
  }

  return items;
}

function normalizeScope(scope) {
  return scope === "incremental" ? "incremental" : "full";
}

function normalizeMode(mode) {
  return mode === "scheduled" ? "scheduled" : "manual";
}

function isOptedInPreference(document) {
  return String(document?.improveModelForEveryone || "").toLowerCase() === "true";
}

function buildTrainingMessages(messages) {
  const normalized = messages
    .map((message) => ({
      role: String(message.role || "").trim(),
      content: String(message.content || "").trim(),
      createdAt: String(message.createdAt || message.$createdAt || ""),
    }))
    .filter((message) => message.role && message.content)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));

  const hasUser = normalized.some((message) => message.role === "user");
  const hasAssistant = normalized.some((message) => message.role === "assistant");

  if (!hasUser || !hasAssistant) {
    return [];
  }

  return normalized.map(({ role, content }) => ({ role, content }));
}

function summarizeTrainingExport(job, files) {
  if (!job) {
    return null;
  }

  return {
    id: job.$id,
    status: job.status,
    mode: job.mode,
    exportName: job.exportName,
    scope: job.scope,
    totalOptedInUsers: Number(job.totalOptedInUsers || 0),
    totalEligibleConversations: Number(job.totalEligibleConversations || 0),
    totalEligibleMessages: Number(job.totalEligibleMessages || 0),
    totalExamples: Number(job.totalExamples || 0),
    totalFiles: Number(job.totalFiles || 0),
    startedAt: job.startedAt || null,
    completedAt: job.completedAt || null,
    failedAt: job.failedAt || null,
    lastMessageCreatedAtIncluded: job.lastMessageCreatedAtIncluded || null,
    r2Prefix: job.r2Prefix || "",
    errorMessage: job.errorMessage || "",
    files: Array.isArray(files)
      ? files.map((file) => ({
          id: file.$id,
          exportId: file.exportId,
          partNumber: Number(file.partNumber || 0),
          fileName: file.fileName,
          objectKey: file.objectKey,
          exampleCount: Number(file.exampleCount || 0),
          fileSizeBytes: Number(file.fileSizeBytes || 0),
          createdAt: file.createdAt || file.$createdAt || null,
        }))
      : [],
  };
}

async function listAllDocuments(collectionId, queries = []) {
  const databases = createAdminDatabases();
  const documents = [];
  let cursor = "";

  while (true) {
    const result = await databases.listDocuments(databaseId, collectionId, [
      ...queries,
      Query.limit(PAGE_SIZE),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);

    documents.push(...result.documents);

    if (result.documents.length < PAGE_SIZE) {
      break;
    }

    cursor = result.documents[result.documents.length - 1].$id;
  }

  return documents;
}

async function listAllUsers() {
  const users = createAdminUsers();
  const items = [];
  let cursor = "";

  while (true) {
    const result = await users.list([
      Query.limit(PAGE_SIZE),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);

    items.push(...result.users);

    if (result.users.length < PAGE_SIZE) {
      break;
    }

    cursor = result.users[result.users.length - 1].$id;
  }

  return items;
}

async function listOptedInPreferences() {
  return listAllDocuments(userPreferencesCollectionId, [
    Query.equal("improveModelForEveryone", "true"),
  ]);
}

async function listConversationsForUsers(userIds) {
  const conversations = [];

  for (const ids of chunk(userIds, USER_BATCH_SIZE)) {
    const items = await listAllDocuments(conversationsCollectionId, [Query.equal("userId", ids)]);
    conversations.push(...items);
  }

  return conversations;
}

async function listMessagesForUsers(userIds) {
  const messages = [];

  for (const ids of chunk(userIds, USER_BATCH_SIZE)) {
    const items = await listAllDocuments(messagesCollectionId, [Query.equal("userId", ids)]);
    messages.push(...items);
  }

  return messages;
}

async function getLatestSuccessfulExport() {
  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, trainingExportsCollectionId, [
    Query.orderDesc("startedAt"),
    Query.limit(20),
  ]);

  return result.documents.find((document) => document.status === "completed") || null;
}

async function createTrainingExportJob({ scope, mode }) {
  const databases = createAdminDatabases();
  const now = new Date().toISOString();

  return databases.createDocument(
    databaseId,
    trainingExportsCollectionId,
    ID.unique(),
    {
      status: "pending",
      mode,
      exportName: "",
      scope,
      totalOptedInUsers: 0,
      totalEligibleConversations: 0,
      totalEligibleMessages: 0,
      totalExamples: 0,
      totalFiles: 0,
      startedAt: now,
      completedAt: "",
      failedAt: "",
      lastMessageCreatedAtIncluded: "",
      r2Prefix: "",
      errorMessage: "",
    },
  );
}

async function updateTrainingExportJob(exportId, patch) {
  const databases = createAdminDatabases();
  return databases.updateDocument(
    databaseId,
    trainingExportsCollectionId,
    exportId,
    patch,
  );
}

async function createTrainingExportFile(exportId, file) {
  const databases = createAdminDatabases();
  return databases.createDocument(
    databaseId,
    trainingExportFilesCollectionId,
    ID.unique(),
    {
      exportId,
      partNumber: file.partNumber,
      fileName: file.fileName,
      objectKey: file.objectKey,
      exampleCount: file.exampleCount,
      fileSizeBytes: file.fileSizeBytes,
      createdAt: file.createdAt,
    },
  );
}

function buildExportPrefix(exportId) {
  const date = new Date().toISOString().slice(0, 10);
  return `${TRAINING_EXPORT_PREFIX}/${date}/export_${exportId}`;
}

function buildExportName(scope, mode, exportId) {
  return `nexa-training-${mode}-${scope}-${exportId}`;
}

function groupMessagesByConversation(messages) {
  const byConversationId = new Map();

  for (const message of messages) {
    const items = byConversationId.get(message.conversationId) || [];
    items.push(message);
    byConversationId.set(message.conversationId, items);
  }

  return byConversationId;
}

function filterMessagesForScope(messages, watermark) {
  if (!watermark) {
    return messages;
  }

  return messages.filter((message) => String(message.createdAt || "").localeCompare(watermark) > 0);
}

async function collectEligibleTrainingData(scope) {
  const optedInPreferences = await listOptedInPreferences();
  const optedInUserIds = optedInPreferences.map((document) => document.userId).filter(Boolean);

  if (optedInUserIds.length === 0) {
    return {
      optedInPreferences,
      optedInUserIds,
      examples: [],
      totalEligibleConversations: 0,
      totalEligibleMessages: 0,
      lastIncludedMessageCreatedAt: "",
      watermark: "",
      rawConversations: [],
      rawMessages: [],
    };
  }

  const latestSuccessfulExport =
    scope === "incremental" ? await getLatestSuccessfulExport() : null;
  const watermark =
    scope === "incremental" ? latestSuccessfulExport?.lastMessageCreatedAtIncluded || "" : "";
  const [rawConversations, rawMessages] = await Promise.all([
    listConversationsForUsers(optedInUserIds),
    listMessagesForUsers(optedInUserIds),
  ]);
  const messagesByConversationId = groupMessagesByConversation(rawMessages);
  const examples = [];
  let totalEligibleMessages = 0;
  let lastIncludedMessageCreatedAt = watermark;

  for (const conversation of rawConversations) {
    const fullConversationMessages = (messagesByConversationId.get(conversation.$id) || [])
      .map((message) => ({
        ...message,
        createdAt: message.createdAt || message.$createdAt || "",
      }))
      .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
    const scopedMessages = filterMessagesForScope(fullConversationMessages, watermark);
    const trainingMessages = buildTrainingMessages(scopedMessages);

    if (trainingMessages.length === 0) {
      continue;
    }

    totalEligibleMessages += trainingMessages.length;
    const latestMessage = scopedMessages[scopedMessages.length - 1];
    if (latestMessage?.createdAt && latestMessage.createdAt.localeCompare(lastIncludedMessageCreatedAt) > 0) {
      lastIncludedMessageCreatedAt = latestMessage.createdAt;
    }

    examples.push({
      conversationId: conversation.$id,
      userId: conversation.userId,
      archived: String(conversation.archived || "").toLowerCase() === "true",
      messages: trainingMessages,
      updatedAt: conversation.updatedAt || conversation.$updatedAt || "",
    });
  }

  return {
    optedInPreferences,
    optedInUserIds,
    examples,
    totalEligibleConversations: examples.length,
    totalEligibleMessages,
    lastIncludedMessageCreatedAt,
    watermark,
    rawConversations,
    rawMessages,
  };
}

function buildManifest({ exportId, exportName, scope, mode, prefix, files, totals, watermark, completedAt }) {
  return {
    exportId,
    exportName,
    scope,
    mode,
    totalExamples: totals.totalExamples,
    totalFiles: totals.totalFiles,
    totalEligibleConversations: totals.totalEligibleConversations,
    totalEligibleMessages: totals.totalEligibleMessages,
    totalOptedInUsers: totals.totalOptedInUsers,
    lastMessageCreatedAtIncluded: watermark || null,
    completedAt,
    files: files.map((file) => ({
      fileName: file.fileName,
      objectKey: file.objectKey,
      exampleCount: file.exampleCount,
      fileSizeBytes: file.fileSizeBytes,
    })),
    manifestObjectKey: `${prefix}/export_manifest.json`,
    optedInUsersSummaryObjectKey: `${prefix}/opted_in_users_summary.json`,
  };
}

async function uploadTrainingArtifacts({ exportId, exportName, scope, mode, prefix, examples, optedInPreferences, watermark, totals }) {
  const files = [];
  const parts = chunk(examples, EXPORT_PART_SIZE);
  const createdAt = new Date().toISOString();

  for (let index = 0; index < parts.length; index += 1) {
    const items = parts[index];
    const fileName = `train_part_${String(index + 1).padStart(3, "0")}.jsonl`;
    const objectKey = `${prefix}/${fileName}`;
    const body = items
      .map((item) =>
        JSON.stringify({
          category: "conversation_export",
          messages: item.messages,
        }),
      )
      .join("\n");
    const fileSizeBytes = Buffer.byteLength(body, "utf8");

    await uploadR2Object({
      key: objectKey,
      body,
      contentType: "application/x-ndjson",
    });

    const file = {
      partNumber: index + 1,
      fileName,
      objectKey,
      exampleCount: items.length,
      fileSizeBytes,
      createdAt,
    };

    files.push(file);
    await createTrainingExportFile(exportId, file);
  }

  const manifest = buildManifest({
    exportId,
    exportName,
    scope,
    mode,
    prefix,
    files,
    totals,
    watermark,
    completedAt: createdAt,
  });
  const optedInUsersSummary = {
    totalOptedInUsers: optedInPreferences.length,
    users: optedInPreferences.map((document) => ({
      userId: document.userId,
      trainingOptInAt: document.trainingOptInAt || null,
      trainingOptOutAt: document.trainingOptOutAt || null,
      updatedAt: document.updatedAt || document.$updatedAt || null,
    })),
  };

  await Promise.all([
    uploadR2Object({
      key: `${prefix}/export_manifest.json`,
      body: JSON.stringify(manifest, null, 2),
      contentType: "application/json",
    }),
    uploadR2Object({
      key: `${prefix}/opted_in_users_summary.json`,
      body: JSON.stringify(optedInUsersSummary, null, 2),
      contentType: "application/json",
    }),
  ]);

  return { files, createdAt };
}

export async function getTrainingOverview() {
  const [users, optedInPreferences, latestExport] = await Promise.all([
    listAllUsers(),
    listOptedInPreferences(),
    getLatestSuccessfulExport(),
  ]);

  const optedInUserIds = optedInPreferences.map((document) => document.userId).filter(Boolean);
  const [conversations, messages] =
    optedInUserIds.length > 0
      ? await Promise.all([
          listConversationsForUsers(optedInUserIds),
          listMessagesForUsers(optedInUserIds),
        ])
      : [[], []];
  const latestExportFiles = latestExport
    ? await listTrainingExportFiles(latestExport.$id)
    : [];

  return {
    totalUsers: users.length,
    optedInUsers: optedInPreferences.length,
    optedOutUsers: Math.max(users.length - optedInPreferences.length, 0),
    eligibleConversations: conversations.length,
    eligibleMessages: messages.length,
    latestExport: summarizeTrainingExport(latestExport, latestExportFiles),
  };
}

export async function listTrainingExports() {
  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, trainingExportsCollectionId, [
    Query.orderDesc("startedAt"),
    Query.limit(50),
  ]);

  return Promise.all(
    result.documents.map(async (document) =>
      summarizeTrainingExport(document, await listTrainingExportFiles(document.$id)),
    ),
  );
}

export async function listTrainingExportFiles(exportId) {
  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, trainingExportFilesCollectionId, [
    Query.equal("exportId", exportId),
    Query.orderAsc("partNumber"),
    Query.limit(200),
  ]);

  return result.documents;
}

export async function getTrainingExportById(exportId) {
  const databases = createAdminDatabases();
  const [job, files] = await Promise.all([
    databases.getDocument(databaseId, trainingExportsCollectionId, exportId),
    listTrainingExportFiles(exportId),
  ]);

  return summarizeTrainingExport(job, files);
}

export async function getTrainingExportDownloadLinks(exportId) {
  const exportJob = await getTrainingExportById(exportId);

  if (!exportJob) {
    throw new Error("Training export not found.");
  }

  const files = await Promise.all(
    exportJob.files.map(async (file) => ({
      ...file,
      url: await createSignedDownloadUrl(file.objectKey),
    })),
  );
  const manifestKey = `${exportJob.r2Prefix}/export_manifest.json`;
  const summaryKey = `${exportJob.r2Prefix}/opted_in_users_summary.json`;

  return {
    exportId: exportJob.id,
    exportName: exportJob.exportName,
    files,
    manifest: {
      objectKey: manifestKey,
      url: await createSignedDownloadUrl(manifestKey),
    },
    optedInUsersSummary: {
      objectKey: summaryKey,
      url: await createSignedDownloadUrl(summaryKey),
    },
  };
}

export async function runTrainingExportJob(input = {}) {
  const scope = normalizeScope(input.scope);
  const mode = normalizeMode(input.mode);
  const job = await createTrainingExportJob({ scope, mode });
  const exportName = buildExportName(scope, mode, job.$id);
  const prefix = buildExportPrefix(job.$id);

  await updateTrainingExportJob(job.$id, {
    status: "running",
    exportName,
    r2Prefix: prefix,
    errorMessage: "",
  });

  try {
    const dataset = await collectEligibleTrainingData(scope);
    const totals = {
      totalOptedInUsers: dataset.optedInPreferences.length,
      totalEligibleConversations: dataset.totalEligibleConversations,
      totalEligibleMessages: dataset.totalEligibleMessages,
      totalExamples: dataset.examples.length,
      totalFiles:
        dataset.examples.length === 0 ? 0 : Math.ceil(dataset.examples.length / EXPORT_PART_SIZE),
    };
    const uploaded = await uploadTrainingArtifacts({
      exportId: job.$id,
      exportName,
      scope,
      mode,
      prefix,
      examples: dataset.examples,
      optedInPreferences: dataset.optedInPreferences,
      watermark: dataset.lastIncludedMessageCreatedAt || dataset.watermark,
      totals,
    });
    const completedJob = await updateTrainingExportJob(job.$id, {
      status: "completed",
      exportName,
      scope,
      mode,
      totalOptedInUsers: totals.totalOptedInUsers,
      totalEligibleConversations: totals.totalEligibleConversations,
      totalEligibleMessages: totals.totalEligibleMessages,
      totalExamples: totals.totalExamples,
      totalFiles: uploaded.files.length,
      completedAt: uploaded.createdAt,
      failedAt: "",
      lastMessageCreatedAtIncluded: dataset.lastIncludedMessageCreatedAt || dataset.watermark || "",
      r2Prefix: prefix,
      errorMessage: "",
    });

    return summarizeTrainingExport(completedJob, await listTrainingExportFiles(job.$id));
  } catch (error) {
    const failedAt = new Date().toISOString();
    await updateTrainingExportJob(job.$id, {
      status: "failed",
      failedAt,
      completedAt: "",
      errorMessage: error?.message || "Training export failed.",
      r2Prefix: prefix,
      exportName,
    });
    throw error;
  }
}

export async function runScheduledTrainingExport() {
  return runTrainingExportJob({ scope: "incremental", mode: "scheduled" });
}
