import { Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  modelRegistryCollectionId,
  modelUsageCollectionId,
  requireAdminFromRequest,
} from "../../../../lib/server/appwrite";

function parseJsonList(value: unknown) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function modelFromDocument(document: any, usage: any[]) {
  const usageForModel = usage.filter((item) => item.modelId === document.modelId);
  const totals = usageForModel.reduce(
    (acc, item) => ({
      requestsToday: acc.requestsToday + Number(item.requestCount || 0),
      inputTokens: acc.inputTokens + Number(item.inputTokens || 0),
      outputTokens: acc.outputTokens + Number(item.outputTokens || 0),
      latencyMs: acc.latencyMs + Number(item.latencyMs || 0),
      errorCount: acc.errorCount + Number(item.errorCount || 0),
      costEstimate: acc.costEstimate + Number(item.costEstimate || 0),
      rows: acc.rows + 1,
    }),
    { requestsToday: 0, inputTokens: 0, outputTokens: 0, latencyMs: 0, errorCount: 0, costEstimate: 0, rows: 0 },
  );

  return {
    id: document.modelId || document.$id,
    name: document.name || document.modelId || "Unnamed model",
    type: document.type || "Unknown",
    provider: document.provider || "Nexa",
    status: document.status || "standby",
    version: document.version || "",
    contextWindow: document.contextWindow ? `${Number(document.contextWindow).toLocaleString()} tokens` : "Not set",
    maxOutputTokens: Number(document.maxOutputTokens || 0),
    requestsToday: totals.requestsToday,
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    avgLatencyMs: totals.rows > 0 ? Math.round(totals.latencyMs / totals.rows) : 0,
    errorRate: totals.requestsToday > 0 ? Number(((totals.errorCount / totals.requestsToday) * 100).toFixed(1)) : 0,
    costEstimate: `$${totals.costEstimate.toFixed(2)}`,
    planAccess: parseJsonList(document.planAccess),
    features: parseJsonList(document.features),
    updatedAt: document.updatedAt || document.$updatedAt || "",
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const databases = createAdminDatabases();
    const [models, usage] = await Promise.all([
      databases.listDocuments(databaseId, modelRegistryCollectionId, [
        Query.orderDesc("updatedAt"),
        Query.limit(200),
      ]),
      databases.listDocuments(databaseId, modelUsageCollectionId, [
        Query.orderDesc("createdAt"),
        Query.limit(500),
      ]),
    ]);

    return Response.json({
      items: (models.documents || []).map((document) => modelFromDocument(document, usage.documents || [])),
      meta: {
        totalModels: models.total || models.documents?.length || 0,
        usageRows: usage.total || usage.documents?.length || 0,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load model registry." },
      { status: 500 },
    );
  }
}
