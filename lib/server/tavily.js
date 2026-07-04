const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const DEFAULT_MAX_RESULTS = 6;
const DEFAULT_TIMEOUT_MS = 9000;

function tavilyApiKey() {
  return process.env.TAVILY_API_KEY || process.env.TAVILY_SEARCH_API_KEY || "";
}

function clampMaxResults(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(10, Math.max(3, Math.floor(parsed)));
}

function inferTopic(query) {
  const normalized = String(query || "").toLowerCase();
  if (/\b(news|latest|today|this week|breaking|update|updates|what happened)\b/.test(normalized)) {
    return "news";
  }
  return "general";
}

function inferTimeRange(query) {
  const normalized = String(query || "").toLowerCase();
  if (/\b(today|now|breaking)\b/.test(normalized)) {
    return "day";
  }
  if (/\b(this week|latest|recent|updates?)\b/.test(normalized)) {
    return "week";
  }
  if (/\b(this month|new|current)\b/.test(normalized)) {
    return "month";
  }
  return undefined;
}

function normalizeTavilyResult(result, index) {
  const url = String(result?.url || "").trim();
  if (!url) {
    return null;
  }

  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = "";
  }

  const score = typeof result?.score === "number" ? result.score : null;
  const confidence = score === null ? "medium" : score >= 0.72 ? "high" : score >= 0.45 ? "medium" : "low";

  return {
    title: String(result?.title || domain || `Source ${index + 1}`).trim(),
    url,
    domain,
    snippet: String(result?.content || result?.raw_content || "").trim(),
    confidence,
    score,
    publishedDate: result?.published_date || result?.publishedDate || "",
  };
}

function sourceConfidence(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return "none";
  }
  if (sources.some((source) => source.confidence === "high")) {
    return "high";
  }
  if (sources.some((source) => source.confidence === "medium")) {
    return "medium";
  }
  return "low";
}

function buildTavilyGroundingPrompt({ query, answer, sources }) {
  const sourceLines = sources
    .map((source, index) => {
      const date = source.publishedDate ? ` Published: ${source.publishedDate}.` : "";
      const snippet = source.snippet ? ` Summary: ${source.snippet}` : "";
      return `[${index + 1}] ${source.title} (${source.domain || source.url}).${date}${snippet} URL: ${source.url}`;
    })
    .join("\n");

  const tavilyAnswer = answer ? `\nTavily summary:\n${answer}\n` : "";

  return [
    "Fresh web context:",
    `Search query: ${query}`,
    tavilyAnswer.trim(),
    "Use the sources below for current facts. If the sources do not support a claim, say so instead of guessing.",
    "When you use web facts, mention the relevant source names in the answer naturally. Do not expose internal search metadata.",
    sourceLines,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function searchTavily(query, options = {}) {
  const apiKey = tavilyApiKey();
  if (!apiKey) {
    return {
      used: false,
      reason: "missing_api_key",
      answer: "",
      sources: [],
      sourceConfidence: "none",
      groundingPrompt: "",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(options.timeoutMs || process.env.TAVILY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  );

  try {
    const maxResults = clampMaxResults(options.maxResults || process.env.TAVILY_MAX_RESULTS);
    const topic = options.topic || inferTopic(query);
    const timeRange = options.timeRange || inferTimeRange(query);
    const searchDepth = options.searchDepth || process.env.TAVILY_SEARCH_DEPTH || "basic";

    const response = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        topic,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: "basic",
        include_raw_content: false,
        include_images: false,
        ...(timeRange ? { time_range: timeRange } : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        used: false,
        reason: `http_${response.status}`,
        answer: "",
        sources: [],
        sourceConfidence: "none",
        groundingPrompt: "",
      };
    }

    const data = await response.json();
    const sources = Array.isArray(data.results)
      ? data.results.map(normalizeTavilyResult).filter(Boolean)
      : [];
    const confidence = sourceConfidence(sources);

    return {
      used: sources.length > 0,
      reason: sources.length > 0 ? "ok" : "no_results",
      answer: String(data.answer || "").trim(),
      sources,
      sourceConfidence: confidence,
      groundingPrompt: sources.length
        ? buildTavilyGroundingPrompt({
            query,
            answer: data.answer,
            sources,
          })
        : "",
    };
  } catch (error) {
    return {
      used: false,
      reason: error?.name === "AbortError" ? "timeout" : "request_failed",
      answer: "",
      sources: [],
      sourceConfidence: "none",
      groundingPrompt: "",
    };
  } finally {
    clearTimeout(timeout);
  }
}
