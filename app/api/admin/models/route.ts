import { Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  modelRegistryCollectionId,
  modelUsageCollectionId,
  requireAdminFromRequest,
} from "../../../../lib/server/appwrite";

const ACTIVE_NEXA_MODELS = [
  {
    modelId: "nexa-ember-0-5",
    name: "Ember 0.5",
    type: "Text / Chat",
    provider: "Nexa Private Runtime",
    status: "active",
    version: "Ember 0.5",
    contextWindow: 262144,
    maxOutputTokens: 8192,
    planAccess: ["Free", "Plus", "Pro", "Business"],
    features: [
      "chat",
      "streaming",
      "tool routing",
      "browser assistance",
      "Fast / Thinker / Deep Thinker",
      "CUDA-aware private inference",
    ],
    endpoint: "/chat, /chat/stream, /v1/chat/completions",
    runtime: "C:\\Nexa private model API",
    usageSource: "Merged with Appwrite model_usage rows when present",
    updatedAt: "2026-07-12",
  },
  {
    modelId: "nexa-ideation-local-image",
    name: "Nexa Ideation Local Image",
    type: "Image",
    provider: "Nexa Diffusers / Local Ideation",
    status: "active",
    version: "Ideation local checkpoint",
    contextWindow: 0,
    maxOutputTokens: 0,
    planAccess: ["Plus", "Pro", "Business"],
    features: [
      "text-to-image",
      "prompt optimization",
      "image jobs",
      "aspect ratio control",
      "local backend routing",
    ],
    endpoint: "/v1/image/generations, /v1/image/jobs",
    runtime: "Unified Nexa API image backend",
    usageSource: "Image job records plus model_usage rows when present",
    updatedAt: "2026-07-12",
  },
  {
    modelId: "nexa-f5tts-voice",
    name: "Nexa F5-TTS Voice",
    type: "Voice / TTS",
    provider: "F5-TTS",
    status: "standby",
    version: "F5TTS_v1_Base",
    contextWindow: 0,
    maxOutputTokens: 0,
    planAccess: ["Plus", "Pro", "Business"],
    features: [
      "voice synthesis",
      "voice reference support",
      "silence trimming",
      "local device selection",
    ],
    endpoint: "/v1/audio/speech",
    runtime: "C:\\Nexa Ai voice runtime",
    usageSource: "Voice usage rows when present",
    updatedAt: "2026-07-12",
  },
  {
    modelId: "nexa-edge-tts",
    name: "Nexa Edge TTS",
    type: "Voice / TTS",
    provider: "Microsoft Edge TTS",
    status: "active",
    version: "en-US-AvaMultilingualNeural",
    contextWindow: 0,
    maxOutputTokens: 0,
    planAccess: ["Free", "Plus", "Pro", "Business"],
    features: ["speech synthesis", "streamable audio", "rate control", "pitch control"],
    endpoint: "/v1/audio/speech",
    runtime: "C:\\Nexa Ai voice runtime",
    usageSource: "Voice usage rows when present",
    updatedAt: "2026-07-12",
  },
  {
    modelId: "nexa-elevenlabs-flash",
    name: "Nexa ElevenLabs Flash",
    type: "Voice / TTS",
    provider: "ElevenLabs",
    status: "standby",
    version: "eleven_flash_v2_5",
    contextWindow: 0,
    maxOutputTokens: 0,
    planAccess: ["Pro", "Business"],
    features: ["hosted speech synthesis", "voice id routing", "low latency speech"],
    endpoint: "/v1/audio/speech",
    runtime: "C:\\Nexa Ai voice runtime",
    usageSource: "Voice usage rows when present",
    updatedAt: "2026-07-12",
  },
  {
    modelId: "nexa-faster-whisper-stt",
    name: "Nexa Faster Whisper STT",
    type: "Speech / STT",
    provider: "Faster Whisper",
    status: "active",
    version: "tiny",
    contextWindow: 0,
    maxOutputTokens: 0,
    planAccess: ["Free", "Plus", "Pro", "Business"],
    features: ["speech-to-text", "CUDA-aware loading", "CPU fallback", "voice input"],
    endpoint: "/v1/audio/transcriptions",
    runtime: "C:\\Nexa Ai speech runtime",
    usageSource: "Speech usage rows when present",
    updatedAt: "2026-07-12",
  },
  {
    modelId: "nexa-wake-word",
    name: "Nexa Wake Word",
    type: "Wake Word",
    provider: "OpenWakeWord",
    status: "standby",
    version: "Hey_Nexa_20260605_002733.onnx",
    contextWindow: 0,
    maxOutputTokens: 0,
    planAccess: ["Plus", "Pro", "Business"],
    features: ["hands-free activation", "local ONNX wake model", "voice session trigger"],
    endpoint: "/v1/voice/wake",
    runtime: "C:\\Nexa Ai wake runtime",
    usageSource: "Wake usage rows when present",
    updatedAt: "2026-07-12",
  },
];

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
    endpoint: document.endpoint || "",
    runtime: document.runtime || "",
    usageSource: document.usageSource || "Appwrite model_usage",
    updatedAt: document.updatedAt || document.$updatedAt || "",
  };
}

function mergeActiveModelDefaults(documents: any[], usage: any[]) {
  const documentModels = (documents || []).map((document) => modelFromDocument(document, usage));
  const documentIds = new Set(documentModels.map((model) => model.id));
  const defaultModels = ACTIVE_NEXA_MODELS
    .filter((model) => !documentIds.has(model.modelId))
    .map((model) => modelFromDocument(model, usage));

  return [...documentModels, ...defaultModels].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return a.name.localeCompare(b.name);
  });
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

    const items = mergeActiveModelDefaults(models.documents || [], usage.documents || []);

    return Response.json({
      items,
      meta: {
        totalModels: items.length,
        registryModels: models.total || models.documents?.length || 0,
        defaultActiveModels: ACTIVE_NEXA_MODELS.length,
        usageRows: usage.total || usage.documents?.length || 0,
      },
    });
  } catch (error: any) {
    const items = mergeActiveModelDefaults([], []);

    return Response.json({
      items,
      meta: {
        totalModels: items.length,
        registryModels: 0,
        defaultActiveModels: ACTIVE_NEXA_MODELS.length,
        usageRows: 0,
        warning: error?.message || "Failed to load model registry. Showing active Nexa defaults.",
      },
    });
  }
}
