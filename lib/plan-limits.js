export const PLAN_USAGE_METRICS = {
  CHAT_MESSAGES: "chat_messages",
  THINKER_MESSAGES: "thinker_messages",
  DEEP_THINKER_MESSAGES: "deep_thinker_messages",
  IMAGE_GENERATIONS: "image_generations",
  VOICE_MINUTES: "voice_minutes",
  BROWSER_WORKFLOWS: "browser_workflows",
  API_REQUESTS: "api_requests",
  MEMORY_ITEMS: "memory_items",
  STORAGE_BYTES: "storage_bytes",
};

export const PLAN_USAGE_STATES = {
  NORMAL: "normal",
  WARNING: "warning",
  CAPPED: "capped",
};

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const PLAN_LIMITS = {
  starter: {
    chatMessages: { day: 25, month: 500 },
    thinkerMessages: { day: 5 },
    deepThinkerMessages: { day: 0, locked: true },
    imageGenerations: { day: 1, month: 10 },
    imageQuality: { maxDim: 768, steps: 24, guidance: 7.0 },
    concurrentImageJobs: 1,
    voiceMinutes: { month: 5 },
    browserWorkflows: { day: 3 },
    fileUploadMaxBytes: 25 * MB,
    storageBytes: 1 * GB,
    memoryItems: 100,
    apiRequests: { month: 0, locked: true },
    support: "Community",
  },
  plus: {
    chatMessages: { day: 500, month: 15000 },
    thinkerMessages: { day: 250 },
    deepThinkerMessages: { day: 50 },
    imageGenerations: { day: 50, month: 1500 },
    imageQuality: { maxDim: 768, steps: 24, guidance: 7.0 },
    concurrentImageJobs: 2,
    voiceMinutes: { month: 300 },
    browserWorkflows: { day: 100 },
    fileUploadMaxBytes: 100 * MB,
    storageBytes: 20 * GB,
    memoryItems: 2000,
    apiRequests: { month: 10000 },
    support: "Standard",
  },
  pro: {
    chatMessages: { day: -1, month: -1, unlimited: true },
    thinkerMessages: { day: 1250 },
    deepThinkerMessages: { day: 250 },
    imageGenerations: { day: -1, month: -1, unlimited: true },
    imageQuality: { maxDim: 1024, defaultMaxDim: 768, steps: 24, qualitySteps: 40, guidance: 7.0, qualityGuidance: 7.5 },
    concurrentImageJobs: 4,
    voiceMinutes: { month: 1500 },
    browserWorkflows: { day: 500 },
    fileUploadMaxBytes: 250 * MB,
    storageBytes: 100 * GB,
    memoryItems: 10000,
    apiRequests: { month: 250000 },
    support: "Priority",
  },
  premium: {
    chatMessages: { day: 5000, month: 150000 },
    thinkerMessages: { day: 3000 },
    deepThinkerMessages: { day: 1000 },
    imageGenerations: { day: 250, month: 8000 },
    imageQuality: { maxDim: 1024, defaultMaxDim: 1024, steps: 40, guidance: 7.5 },
    concurrentImageJobs: 8,
    voiceMinutes: { month: 5000 },
    browserWorkflows: { day: 2000 },
    fileUploadMaxBytes: 1 * GB,
    storageBytes: 500 * GB,
    memoryItems: 50000,
    apiRequests: { month: 1000000 },
    support: "Priority plus",
  },
  business: {
    chatMessages: { day: 1000, month: 30000, perSeat: true },
    thinkerMessages: { day: 500, perSeat: true },
    deepThinkerMessages: { day: 100, perSeat: true },
    imageGenerations: { day: 50, month: 1500, perSeat: true, pooled: true },
    imageQuality: { maxDim: 768, steps: 24, guidance: 7.0, teamPolicy: true },
    concurrentImageJobs: { perSeat: 3, teamCap: 20 },
    voiceMinutes: { month: 600, perSeat: true },
    browserWorkflows: { day: 250, perSeat: true },
    fileUploadMaxBytes: 250 * MB,
    storageBytes: { perSeat: 50 * GB, pooled: true },
    memoryItems: { perSeat: 5000, pooled: true },
    apiRequests: { month: 100000, perSeat: true },
    support: "Team support",
  },
  enterprise: {
    custom: true,
    support: "Dedicated support",
  },
};

export const METRIC_LIMIT_CONFIG = {
  [PLAN_USAGE_METRICS.CHAT_MESSAGES]: { limitKey: "chatMessages", periodTypes: ["day", "month"] },
  [PLAN_USAGE_METRICS.THINKER_MESSAGES]: { limitKey: "thinkerMessages", periodTypes: ["day"] },
  [PLAN_USAGE_METRICS.DEEP_THINKER_MESSAGES]: { limitKey: "deepThinkerMessages", periodTypes: ["day"] },
  [PLAN_USAGE_METRICS.IMAGE_GENERATIONS]: { limitKey: "imageGenerations", periodTypes: ["day", "month"] },
  [PLAN_USAGE_METRICS.VOICE_MINUTES]: { limitKey: "voiceMinutes", periodTypes: ["month"] },
  [PLAN_USAGE_METRICS.BROWSER_WORKFLOWS]: { limitKey: "browserWorkflows", periodTypes: ["day"] },
  [PLAN_USAGE_METRICS.API_REQUESTS]: { limitKey: "apiRequests", periodTypes: ["month"] },
  [PLAN_USAGE_METRICS.MEMORY_ITEMS]: { limitKey: "memoryItems", periodTypes: ["all_time"] },
  [PLAN_USAGE_METRICS.STORAGE_BYTES]: { limitKey: "storageBytes", periodTypes: ["all_time"] },
};

function normalizePlanId(planId) {
  return String(planId || "starter").trim().toLowerCase() || "starter";
}

export function getPlanLimits(planId) {
  return PLAN_LIMITS[normalizePlanId(planId)] || PLAN_LIMITS.starter;
}

export function getMetricLimit(planId, metric, periodType, seatCount = 1) {
  const limits = getPlanLimits(planId);
  if (limits.custom) {
    return null;
  }

  const config = METRIC_LIMIT_CONFIG[metric];
  if (!config) {
    return null;
  }

  const raw = limits[config.limitKey];
  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw === "number") {
    return raw;
  }

  if (typeof raw === "object") {
    if (raw.unlimited) {
      return null;
    }

    if (raw.locked) {
      return 0;
    }

    const value = raw[periodType];
    if (typeof value === "number") {
      return raw.perSeat ? value * Math.max(1, Number(seatCount || 1)) : value;
    }

    if (periodType === "all_time") {
      if (typeof raw.perSeat === "number") {
        return raw.perSeat * Math.max(1, Number(seatCount || 1));
      }
      if (typeof raw.value === "number") {
        return raw.value;
      }
    }
  }

  return null;
}

export function usageState(used, limit) {
  if (!limit || limit < 0) {
    return PLAN_USAGE_STATES.NORMAL;
  }
  const ratio = Number(used || 0) / Number(limit || 1);
  if (ratio >= 1) {
    return PLAN_USAGE_STATES.CAPPED;
  }
  if (ratio >= 0.8) {
    return PLAN_USAGE_STATES.WARNING;
  }
  return PLAN_USAGE_STATES.NORMAL;
}

export function formatLimitValue(metric, value) {
  if (metric === PLAN_USAGE_METRICS.STORAGE_BYTES) {
    if (value >= GB) return `${Math.round(value / GB)} GB`;
    if (value >= MB) return `${Math.round(value / MB)} MB`;
  }
  return new Intl.NumberFormat("en-US").format(value);
}
