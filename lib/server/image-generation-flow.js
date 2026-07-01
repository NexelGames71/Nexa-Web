import {
  buildConversationTitle,
  extractAndPersistMemory,
  saveMessage,
  updateConversationSummary,
} from "./memory";
import {
  assertStorageQuotaAvailable,
  buildGeneratedImageId,
  buildStorageAssetId,
  incrementStorageUsage,
  saveGeneratedImageRecord,
  saveStorageAssetRecord,
} from "./generated-images";
import {
  createSignedDownloadUrl,
  ensureR2Config,
  r2UserStorageBucketName,
  uploadR2Object,
} from "./r2";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const IMAGE_JOB_TIMEOUT_MS = 15 * 60 * 1000;

export function assertGeneratedImageStorageConfigured() {
  try {
    ensureR2Config(r2UserStorageBucketName, "R2_USER_STORAGE_BUCKET_NAME");
  } catch (error) {
    throw new Error(
      `Generated image storage failed. Configure Cloudflare R2 before using image generation in production. ${error?.message || error}`,
    );
  }
}

export function imageExtensionFromMime(mimeType) {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }
  if (normalized.includes("webp")) {
    return "webp";
  }
  return "png";
}

function currentStorageDateParts() {
  const now = new Date();
  return {
    year: String(now.getUTCFullYear()),
    month: String(now.getUTCMonth() + 1).padStart(2, "0"),
  };
}

function safeImageName(value) {
  const normalized = String(value || "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return normalized || "image";
}

export async function createBackendImageJob(args) {
  const response = await fetch(`${BACKEND_URL}/v1/image/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: args.prompt,
      aspect_ratio: args.aspect_ratio || "1:1",
      style: args.style || "auto",
      raw_user_intent: args.raw_user_intent || args.prompt,
      optimize: true,
      backend: "ideation_local",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Image job creation failed (${response.status}).`);
  }

  const created = await response.json();
  const backendJobId = created?.job?.id || created?.id;
  if (!backendJobId) {
    throw new Error("Image generation job did not return an id.");
  }

  return {
    backendJobId,
    job: created.job || created,
  };
}

export async function pollBackendImageJob(backendJobId) {
  const response = await fetch(`${BACKEND_URL}/v1/image/jobs/${encodeURIComponent(backendJobId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Image job status failed (${response.status}).`);
  }

  return response.json();
}

export async function waitForBackendImageResult(args) {
  const { backendJobId } = await createBackendImageJob(args);
  const startedAt = Date.now();

  while (Date.now() - startedAt < IMAGE_JOB_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const job = await pollBackendImageJob(backendJobId);
    if (job.status === "failed") {
      throw new Error(job.error || "Image generation failed.");
    }
    if (job.status === "completed" && job.result) {
      return job.result;
    }
  }

  throw new Error("Image generation is still running. Try again in a moment.");
}

export async function persistGeneratedImageAsset(imagePayload, { userId, prompt }) {
  if (imagePayload?.url) {
    return {
      assetId: imagePayload.asset_id || "",
      imageId: imagePayload.image_id || buildGeneratedImageId(),
      imageUrl: imagePayload.url,
      r2Key: imagePayload.r2_key || "",
      format: imageExtensionFromMime(imagePayload.mime_type || "image/png"),
      mimeType: imagePayload.mime_type || "image/png",
      sizeBytes: Number(imagePayload.size_bytes || 0),
      filename: imagePayload.filename || "",
    };
  }

  const b64 = imagePayload?.b64;
  if (!b64) {
    throw new Error("Image generation returned no stored URL or base64 payload.");
  }

  const mimeType = imagePayload.mime_type || "image/png";
  const extension = imageExtensionFromMime(mimeType);
  const safeUserId = String(userId || "user").replace(/[^a-z0-9_-]/gi, "");
  const imageId = buildGeneratedImageId();
  const assetId = buildStorageAssetId();
  const { year, month } = currentStorageDateParts();
  const filename = `Nexa-Generated-Image-${safeImageName(prompt)}-${imageId}.${extension}`;
  const r2Key = `tenants/personal/users/${safeUserId}/images/generated/${year}/${month}/${filename}`;
  const imageBuffer = Buffer.from(b64, "base64");
  const sizeBytes = imageBuffer.length;

  try {
    await assertStorageQuotaAvailable({
      userId,
      tenantId: "personal",
      incomingBytes: sizeBytes,
    });
    await uploadR2Object({
      bucketName: r2UserStorageBucketName,
      bucketEnvName: "R2_USER_STORAGE_BUCKET_NAME",
      key: r2Key,
      body: imageBuffer,
      contentType: mimeType,
    });
    const imageUrl = await createSignedDownloadUrl(
      r2Key,
      60 * 60 * 24 * 7,
      r2UserStorageBucketName,
      "R2_USER_STORAGE_BUCKET_NAME",
    );
    return {
      assetId,
      imageId,
      imageUrl,
      r2Key,
      format: extension,
      mimeType,
      sizeBytes,
      filename,
    };
  } catch (error) {
    throw new Error(
      `Generated image storage failed. Configure Cloudflare R2 before using image generation in production. ${error?.message || error}`,
    );
  }
}

export async function finalizeGeneratedImageJob({ job, imagePayload }) {
  const meta = job.meta || {};
  const content = meta.content || meta.rawUserIntent || meta.prompt || "";
  const prompt = imagePayload.prompt_used || meta.prompt || content;

  const stored = await persistGeneratedImageAsset(imagePayload, {
    userId: job.userId,
    prompt,
  });

  const image = {
    ...imagePayload,
    asset_id: stored.assetId,
    image_id: stored.imageId,
    url: stored.imageUrl,
    r2_key: stored.r2Key,
    format: stored.format,
    mime_type: stored.mimeType || imagePayload.mime_type,
    size_bytes: stored.sizeBytes,
    filename: stored.filename,
    b64: undefined,
  };
  const reply = [`Generated image: ${prompt}`, "", `![Generated image](${stored.imageUrl})`]
    .join("\n")
    .trim();

  const assistantMessage = await saveMessage({
    userId: job.userId,
    conversationId: job.conversationId,
    role: "assistant",
    content: reply,
  });

  if (image.image_id && image.r2_key) {
    try {
      await saveStorageAssetRecord({
        assetId: image.asset_id || "",
        userId: job.userId,
        tenantId: "personal",
        assetType: "image",
        category: "generated",
        filename: image.filename || `${image.image_id}.${image.format || "png"}`,
        mimeType: image.mime_type || "image/png",
        sizeBytes: Number(image.size_bytes || 0),
        bucket: r2UserStorageBucketName,
        r2Key: image.r2_key,
        visibility: "private",
      });
      await saveGeneratedImageRecord({
        imageId: image.image_id,
        assetId: image.asset_id || "",
        userId: job.userId,
        tenantId: "personal",
        conversationId: job.conversationId,
        messageId: assistantMessage.$id || assistantMessage.id || "",
        prompt: content,
        revisedPrompt: prompt,
        model: image.model || "nexa-image-v1",
        provider: image.backend || "local",
        seed: image.seed ?? null,
        format: image.format || imageExtensionFromMime(image.mime_type),
        sizeBytes: Number(image.size_bytes || 0),
        bucket: r2UserStorageBucketName,
        r2Key: image.r2_key,
        thumbnailKey: image.thumbnail_key || "",
        imageUrl: image.url || "",
        status: "completed",
        visibility: "private",
      });
      await incrementStorageUsage({
        userId: job.userId,
        tenantId: "personal",
        sizeBytes: Number(image.size_bytes || 0),
        assetType: "image",
      });
    } catch (error) {
      console.warn("Generated image metadata save failed:", error?.message || error);
    }
  }

  const title = meta.needsGeneratedTitle
    ? buildConversationTitle(`${content} ${prompt}`.trim())
    : meta.conversationTitle || buildConversationTitle(content);
  const conversation = await updateConversationSummary(job.conversationId, job.userId, {
    title,
    lastMessagePreview: `Generated image: ${content}`.slice(0, 120),
  });

  let memory = meta.initialMemory || null;
  try {
    memory = await extractAndPersistMemory(job.userId, content);
  } catch {
    // Keep image finalization resilient if memory extraction is unavailable.
  }

  return {
    reply,
    conversationId: job.conversationId,
    conversation,
    memory,
    userMessage: meta.userMessage || null,
    assistantMessage,
    source_confidence: "none",
    used_web_search: false,
    sources: [],
    image,
    warnings: Array.isArray(imagePayload.warnings) ? imagePayload.warnings : [],
  };
}
