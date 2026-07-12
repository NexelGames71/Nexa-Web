import { ID } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  modelUsageCollectionId,
} from "./appwrite";

const DEFAULT_TEXT_MODEL_ID = "nexa-ember-0-5";
const DEFAULT_IMAGE_MODEL_ID = "nexa-ideation-local-image";

function estimateTokens(value) {
  const text = String(value || "");
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function textModelId() {
  return DEFAULT_TEXT_MODEL_ID;
}

export function imageModelId() {
  return DEFAULT_IMAGE_MODEL_ID;
}

export function usageFromBackendUsage(usage, fallbackInput, fallbackOutput) {
  const inputTokens = Number(usage?.prompt_tokens ?? usage?.input_tokens ?? 0);
  const outputTokens = Number(usage?.completion_tokens ?? usage?.output_tokens ?? 0);

  return {
    inputTokens: inputTokens > 0 ? inputTokens : estimateTokens(fallbackInput),
    outputTokens: outputTokens > 0 ? outputTokens : estimateTokens(fallbackOutput),
  };
}

export async function recordModelUsage({
  modelId,
  userId,
  mode,
  requestCount = 1,
  inputTokens = 0,
  outputTokens = 0,
  latencyMs = 0,
  errorCount = 0,
  costEstimate = 0,
}) {
  try {
    const databases = createAdminDatabases();
    const now = new Date().toISOString();

    await databases.createDocument(databaseId, modelUsageCollectionId, ID.unique(), {
      modelId: String(modelId || DEFAULT_TEXT_MODEL_ID),
      userId: userId ? String(userId) : "",
      mode: String(mode || "unknown"),
      requestCount: Number(requestCount || 1),
      inputTokens: Number(inputTokens || 0),
      outputTokens: Number(outputTokens || 0),
      latencyMs: Number(latencyMs || 0),
      errorCount: Number(errorCount || 0),
      costEstimate: Number(costEstimate || 0),
      createdAt: now,
    });
  } catch (error) {
    console.warn("Model usage record failed:", error?.message || error);
  }
}
