import { randomUUID } from "node:crypto";
import { AppwriteException, Permission, Query, Role } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  imageGenerationJobsCollectionId,
} from "./appwrite";

const JOB_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_RESULT_JSON_CHARS = 8_000;
const ACTIVE_JOB_STATUSES = new Set(["queued", "thinking", "designing", "rendering", "finishing", "processing"]);

const store =
  globalThis.__nexaImageGenerationJobs ||
  {
    jobs: new Map(),
    lastCleanupAt: 0,
  };

globalThis.__nexaImageGenerationJobs = store;

function nowIso() {
  return new Date().toISOString();
}

function cleanupExpiredJobs() {
  const now = Date.now();
  if (now - store.lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  store.lastCleanupAt = now;
  for (const [id, job] of store.jobs.entries()) {
    if (now - job.createdAtMs > JOB_TTL_MS) {
      store.jobs.delete(id);
    }
  }
}

function serializeJob(job) {
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    userId: job.userId,
    conversationId: job.conversationId,
    status: job.status,
    progress: job.progress,
    title: job.title,
    detail: job.detail,
    aspect_ratio: job.aspect_ratio,
    style: job.style,
    meta: job.meta || null,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function serializeJobDocument(document) {
  if (!document) {
    return null;
  }

  let result = null;
  let meta = null;
  if (document.resultJson) {
    try {
      const parsed = JSON.parse(document.resultJson);
      if (parsed?.__jobMeta) {
        meta = parsed.__jobMeta;
      } else {
        result = parsed;
      }
    } catch {
      result = null;
    }
  }

  return {
    id: document.$id,
    userId: document.userId,
    conversationId: document.conversationId,
    status: document.status,
    progress: Number(document.progress || 0),
    title: document.title,
    detail: document.detail,
    aspect_ratio: document.aspectRatio,
    style: document.style,
    meta,
    result,
    error: document.error || null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function encodeResultJson(result, meta) {
  if (!result && !meta) {
    return "";
  }

  if (!result && meta) {
    const metaJson = JSON.stringify({ __jobMeta: meta });
    return metaJson.length <= MAX_RESULT_JSON_CHARS ? metaJson : "";
  }

  const fullJson = JSON.stringify(result);
  if (fullJson.length <= MAX_RESULT_JSON_CHARS) {
    return fullJson;
  }

  const compactResult = {
    reply: result.reply || "",
    conversationId: result.conversationId || "",
    conversation: result.conversation || null,
    assistantMessage: result.assistantMessage || null,
    image: result.image || null,
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    source_confidence: result.source_confidence || "none",
    used_web_search: Boolean(result.used_web_search),
    sources: Array.isArray(result.sources) ? result.sources : [],
  };
  const compactJson = JSON.stringify(compactResult);

  return compactJson.length <= MAX_RESULT_JSON_CHARS ? compactJson : "";
}

function jobDocumentPayload(job, resultOverride) {
  const result = resultOverride === undefined ? job.result : resultOverride;
  return {
    userId: job.userId,
    conversationId: job.conversationId,
    status: job.status,
    progress: Number(job.progress || 0),
    title: job.title || "",
    detail: job.detail || "",
    aspectRatio: job.aspect_ratio || "1:1",
    style: job.style || "image design",
    resultJson: encodeResultJson(result, job.meta),
    error: job.error || "",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function isAppwriteNotFound(error) {
  return error instanceof AppwriteException && Number(error.code) === 404;
}

async function createJobDocument(job) {
  try {
    const databases = createAdminDatabases();
    await databases.createDocument(
      databaseId,
      imageGenerationJobsCollectionId,
      job.id,
      jobDocumentPayload(job),
      [
        Permission.read(Role.user(job.userId)),
        Permission.update(Role.user(job.userId)),
        Permission.delete(Role.user(job.userId)),
      ],
    );
  } catch (error) {
    console.warn("Image generation job persistence create failed:", error?.message || error);
  }
}

async function updateJobDocument(job, resultOverride) {
  try {
    const databases = createAdminDatabases();
    await databases.updateDocument(
      databaseId,
      imageGenerationJobsCollectionId,
      job.id,
      jobDocumentPayload(job, resultOverride),
    );
  } catch (error) {
    if (!isAppwriteNotFound(error)) {
      console.warn("Image generation job persistence update failed:", error?.message || error);
      return;
    }

    await createJobDocument(job);
  }
}

async function getJobDocument(id) {
  try {
    const databases = createAdminDatabases();
    const document = await databases.getDocument(
      databaseId,
      imageGenerationJobsCollectionId,
      String(id || ""),
    );
    return serializeJobDocument(document);
  } catch (error) {
    if (!isAppwriteNotFound(error)) {
      console.warn("Image generation job persistence read failed:", error?.message || error);
    }
    return null;
  }
}

export async function getImageGenerationJob(id) {
  cleanupExpiredJobs();
  return serializeJob(store.jobs.get(String(id || ""))) || getJobDocument(id);
}

export async function updateImageGenerationJob(id, update = {}) {
  cleanupExpiredJobs();

  const existing = store.jobs.get(String(id || "")) || (await getJobDocument(id));
  if (!existing) {
    return null;
  }

  const current = {
    ...existing,
    ...update,
    id: existing.id,
    userId: existing.userId,
    conversationId: existing.conversationId,
    progress: Math.max(
      Number(existing.progress || 0),
      Math.min(100, Number(update.progress ?? existing.progress ?? 0)),
    ),
    meta: update.meta === undefined ? existing.meta : update.meta,
    result: update.result === undefined ? existing.result : update.result,
    error: update.error === undefined ? existing.error : update.error,
    updatedAt: nowIso(),
    createdAtMs: existing.createdAtMs || Date.now(),
  };

  store.jobs.set(current.id, current);
  await updateJobDocument(current, current.result);
  return serializeJob(current);
}

export function createImageGenerationJob({
  userId,
  conversationId,
  initialStatus,
  meta,
}) {
  cleanupExpiredJobs();

  const timestamp = nowIso();
  const job = {
    id: randomUUID(),
    userId,
    conversationId,
    status: initialStatus?.status || "queued",
    progress: Number(initialStatus?.progress || 1),
    title: initialStatus?.title || "Thinking",
    detail:
      initialStatus?.detail ||
      "Planning the image design, detail, style, and aspect ratio before rendering.",
    aspect_ratio: initialStatus?.aspect_ratio || "1:1",
    style: initialStatus?.style || "image design",
    meta: meta || null,
    result: null,
    error: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtMs: Date.now(),
  };

  store.jobs.set(job.id, job);
  void createJobDocument(job);
  return serializeJob(job);
}

export async function countActiveImageGenerationJobs(userId) {
  cleanupExpiredJobs();

  let count = 0;
  for (const job of store.jobs.values()) {
    if (job.userId === userId && ACTIVE_JOB_STATUSES.has(String(job.status || "").toLowerCase())) {
      count += 1;
    }
  }

  try {
    const databases = createAdminDatabases();
    const result = await databases.listDocuments(databaseId, imageGenerationJobsCollectionId, [
      Query.equal("userId", userId),
      Query.limit(100),
    ]);
    const persistedCount = (result.documents || []).filter((document) =>
      ACTIVE_JOB_STATUSES.has(String(document.status || "").toLowerCase()),
    ).length;
    return Math.max(count, persistedCount);
  } catch (error) {
    console.warn("Active image job count unavailable:", error?.message || error);
    return count;
  }
}

export function startImageGenerationJob({
  userId,
  conversationId,
  initialStatus,
  execute,
}) {
  cleanupExpiredJobs();

  const timestamp = nowIso();
  const job = {
    id: randomUUID(),
    userId,
    conversationId,
    status: initialStatus?.status || "queued",
    progress: Number(initialStatus?.progress || 1),
    title: initialStatus?.title || "Thinking",
    detail:
      initialStatus?.detail ||
      "Planning the image design, detail, style, and aspect ratio before rendering.",
    aspect_ratio: initialStatus?.aspect_ratio || "1:1",
    style: initialStatus?.style || "image design",
    result: null,
    error: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdAtMs: Date.now(),
  };

  store.jobs.set(job.id, job);
  void createJobDocument(job);

  const updateProgress = (update = {}) => {
    const current = store.jobs.get(job.id);
    if (!current || current.status === "completed" || current.status === "failed") {
      return;
    }

    current.status = update.status || current.status;
    current.progress = Math.max(
      current.progress,
      Math.min(99, Number(update.progress || current.progress)),
    );
    current.title = update.title || current.title;
    current.detail = update.detail || current.detail;
    current.aspect_ratio = update.aspect_ratio || update.aspectRatio || current.aspect_ratio;
    current.style = update.style || current.style;
    current.updatedAt = nowIso();
    void updateJobDocument(current);
  };

  Promise.resolve()
    .then(() => execute({ updateProgress }))
    .then((result) => {
      const current = store.jobs.get(job.id);
      if (!current) {
        return;
      }

      current.status = "completed";
      current.progress = 100;
      current.title = "Image ready";
      current.detail = "The generated image is ready.";
      current.result = result;
      current.updatedAt = nowIso();
      void updateJobDocument(current, result);
    })
    .catch((error) => {
      const current = store.jobs.get(job.id);
      if (!current) {
        return;
      }

      current.status = "failed";
      current.error = error?.message || "Image generation failed.";
      current.detail = current.error;
      current.updatedAt = nowIso();
      void updateJobDocument(current);
    });

  return serializeJob(job);
}
