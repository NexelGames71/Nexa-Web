import { Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  generatedImagesCollectionId,
  requireUserFromRequest,
} from "../../../lib/server/appwrite";
import {
  createSignedDownloadUrl,
  r2UserStorageBucketName,
} from "../../../lib/server/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeImage(document, signedUrl) {
  return {
    id: document.$id || document.imageId,
    imageId: document.imageId || document.$id,
    prompt: document.prompt || "",
    revisedPrompt: document.revisedPrompt || "",
    model: document.model || "",
    provider: document.provider || "",
    format: document.format || "png",
    sizeBytes: Number(document.sizeBytes || 0),
    width: Number(document.width || 0),
    height: Number(document.height || 0),
    seed: document.seed ?? null,
    status: document.status || "completed",
    url: signedUrl || document.imageUrl || "",
    conversationId: document.conversationId || "",
    createdAt: document.createdAt || document.$createdAt || "",
    updatedAt: document.updatedAt || document.$updatedAt || "",
  };
}

async function imageUrlForDocument(document) {
  const key = document.r2Key || "";
  if (!key) {
    return document.imageUrl || "";
  }

  try {
    return await createSignedDownloadUrl(
      key,
      3600,
      r2UserStorageBucketName,
      "R2_USER_STORAGE_BUCKET_NAME",
    );
  } catch (error) {
    console.warn("Generated image signed URL failed:", error?.message || error);
    return document.imageUrl || "";
  }
}

export async function GET(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  if (!generatedImagesCollectionId) {
    return Response.json({ items: [], meta: { total: 0, warning: "Generated image storage is not configured." } });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 60), 1), 100);
    const databases = createAdminDatabases();
    const result = await databases.listDocuments(databaseId, generatedImagesCollectionId, [
      Query.equal("userId", auth.user.$id),
      Query.orderDesc("createdAt"),
      Query.limit(limit),
    ]);

    const items = await Promise.all(
      (result.documents || []).map(async (document) =>
        normalizeImage(document, await imageUrlForDocument(document)),
      ),
    );

    return Response.json({
      items,
      meta: {
        total: result.total || items.length,
        returned: items.length,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load generated images." },
      { status: 500 },
    );
  }
}
