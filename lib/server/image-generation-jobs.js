import { randomUUID } from "node:crypto";

const JOB_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

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
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function getImageGenerationJob(id) {
  cleanupExpiredJobs();
  return serializeJob(store.jobs.get(String(id || "")));
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
    });

  return serializeJob(job);
}
