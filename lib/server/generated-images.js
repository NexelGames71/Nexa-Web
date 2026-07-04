import { ID } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  generatedImagesCollectionId,
  ownerPermissions,
  storageAssetsCollectionId,
  storageUsageCollectionId,
} from "./appwrite";
import { PLAN_USAGE_METRICS, getMetricLimit } from "../plan-limits";
import { getBillingProfileForUser } from "./billing";
import { checkPlanLimit, recordPlanUsage } from "./plan-usage";

export function buildGeneratedImageId() {
  return `img_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-5)}`;
}

export function buildStorageAssetId() {
  return `asset_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-5)}`;
}

export function isGeneratedImageMetadataEnabled() {
  return Boolean(generatedImagesCollectionId);
}

export async function saveStorageAssetRecord({
  assetId,
  userId,
  tenantId = "personal",
  assetType = "image",
  category = "generated",
  filename,
  mimeType,
  sizeBytes,
  bucket,
  r2Key,
  thumbnailKey = "",
  visibility = "private",
}) {
  if (!storageAssetsCollectionId) {
    return null;
  }

  const databases = createAdminDatabases();
  const now = new Date().toISOString();

  return databases.createDocument(
    databaseId,
    storageAssetsCollectionId,
    assetId || buildStorageAssetId(),
    {
      userId,
      tenantId,
      assetType,
      category,
      filename,
      mimeType,
      sizeBytes,
      r2Bucket: bucket,
      r2Key,
      thumbnailKey,
      visibility,
      status: "active",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    ownerPermissions(userId),
  );
}

export async function incrementStorageUsage({
  userId,
  tenantId = "personal",
  sizeBytes,
  assetType = "image",
}) {
  if (!sizeBytes) {
    return null;
  }

  const now = new Date().toISOString();
  const documentId = `${tenantId}_${userId}`.replace(/[^a-zA-Z0-9._-]/g, "_");
  const billingProfile = await getBillingProfileForUser(userId);
  const planId = billingProfile.plan || "starter";
  const storageLimitBytes = getMetricLimit(planId, PLAN_USAGE_METRICS.STORAGE_BYTES, "all_time") || 0;
  let storageUsageDocument = null;

  if (storageUsageCollectionId) {
    const databases = createAdminDatabases();
    try {
      const current = await databases.getDocument(
        databaseId,
        storageUsageCollectionId,
        documentId,
      );
      const nextStorageUsed = Number(current.storageUsedBytes || 0) + sizeBytes;
      const nextImagesUsed =
        assetType === "image"
          ? Number(current.imagesUsedBytes || 0) + sizeBytes
          : Number(current.imagesUsedBytes || 0);

      storageUsageDocument = await databases.updateDocument(
        databaseId,
        storageUsageCollectionId,
        documentId,
        {
          storageUsedBytes: nextStorageUsed,
          imagesUsedBytes: nextImagesUsed,
          plan: planId,
          storageLimitBytes,
          updatedAt: now,
        },
        ownerPermissions(userId),
      );
    } catch {
      storageUsageDocument = await databases.createDocument(
        databaseId,
        storageUsageCollectionId,
        documentId,
        {
          userId,
          tenantId,
          plan: planId,
          storageLimitBytes,
          storageUsedBytes: sizeBytes,
          imagesUsedBytes: assetType === "image" ? sizeBytes : 0,
          filesUsedBytes: 0,
          memoryUsedBytes: 0,
          audioUsedBytes: 0,
          updatedAt: now,
        },
        ownerPermissions(userId),
      );
    }
  }

  await recordPlanUsage(userId, PLAN_USAGE_METRICS.STORAGE_BYTES, sizeBytes);
  return storageUsageDocument;
}

export async function assertStorageQuotaAvailable({
  userId,
  tenantId = "personal",
  incomingBytes = 0,
}) {
  if (!incomingBytes) {
    return;
  }

  const documentId = `${tenantId}_${userId}`.replace(/[^a-zA-Z0-9._-]/g, "_");

  const planQuota = await checkPlanLimit(userId, PLAN_USAGE_METRICS.STORAGE_BYTES, incomingBytes);
  if (!planQuota.allowed) {
    throw new Error("Nexa Cloud Storage quota exceeded. Delete files or upgrade before saving this image.");
  }

  if (!storageUsageCollectionId) {
    return;
  }

  const databases = createAdminDatabases();
  try {
    const current = await databases.getDocument(
      databaseId,
      storageUsageCollectionId,
      documentId,
    );
    const limit = Number(current.storageLimitBytes || 0);
    const used = Number(current.storageUsedBytes || 0);
    if (limit > 0 && used + incomingBytes > limit) {
      throw new Error("Nexa Cloud Storage quota exceeded. Delete files or upgrade before saving this image.");
    }
  } catch (error) {
    if (String(error?.message || "").includes("quota exceeded")) {
      throw error;
    }
  }
}

export async function saveGeneratedImageRecord({
  imageId,
  assetId = "",
  userId,
  tenantId = "personal",
  conversationId,
  messageId = "",
  prompt,
  revisedPrompt = "",
  negativePrompt = "",
  model = "",
  provider = "local",
  steps = 0,
  guidance = 0,
  seed = null,
  width = 0,
  height = 0,
  format = "png",
  sizeBytes = 0,
  bucket = "",
  r2Key,
  thumbnailKey = "",
  imageUrl = "",
  status = "completed",
  visibility = "private",
}) {
  if (!generatedImagesCollectionId) {
    return null;
  }

  const databases = createAdminDatabases();
  const now = new Date().toISOString();

  return databases.createDocument(
    databaseId,
    generatedImagesCollectionId,
    imageId || ID.unique(),
    {
      assetId,
      userId,
      tenantId,
      conversationId,
      messageId,
      assetType: "image",
      source: "generated",
      prompt,
      revisedPrompt,
      negativePrompt,
      model,
      provider,
      steps,
      guidance,
      seed,
      width,
      height,
      format,
      sizeBytes,
      r2Bucket: bucket,
      r2Key,
      thumbnailKey,
      imageUrl,
      status,
      visibility,
      signedUrlRequired: true,
      createdAt: now,
      updatedAt: now,
    },
    ownerPermissions(userId),
  );
}
