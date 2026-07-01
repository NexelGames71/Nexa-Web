import {
  DEFAULT_CONVERSATION_TITLE,
  buildConversationTitle,
  buildMemorySystemPrompt,
  createConversation,
  extractAndPersistMemory,
  getConversation,
  getUserMemory,
  saveMessage,
  updateConversationSummary,
} from "../../../lib/server/memory";
import { requireUserFromRequest } from "../../../lib/server/appwrite";
import {
  assertStorageQuotaAvailable,
  buildGeneratedImageId,
  buildStorageAssetId,
  incrementStorageUsage,
  saveGeneratedImageRecord,
  saveStorageAssetRecord,
} from "../../../lib/server/generated-images";
import { startImageGenerationJob } from "../../../lib/server/image-generation-jobs";
import {
  createSignedDownloadUrl,
  ensureR2Config,
  r2UserStorageBucketName,
  uploadR2Object,
} from "../../../lib/server/r2";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const DEFAULT_MAX_NEW_TOKENS = 768;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 0.9;
const MAX_CONTEXT_MESSAGES = 8;
const TITLE_MAX_NEW_TOKENS = 12;
const encoder = new TextEncoder();
const CONTINUITY_SYSTEM_PROMPT = [
  "Conversation continuity rules:",
  "Treat short follow-up questions as referring to the recent conversation unless the user clearly changes topic.",
  "Resolve pronouns, typos, shorthand, and prompts like 'what about X' using the last few turns.",
  "When a direct follow-up answer is possible, do not restart with a generic introduction.",
  "If prior context is genuinely insufficient, ask a brief clarifying question instead of guessing.",
].join("\n");
const GROUNDING_SYSTEM_PROMPT = [
  "Grounding rules:",
  "You are Nexa, developed by Nexa Labs.",
  "Do not invent personal backstories, hidden affiliations, or extra identity details.",
  "If the user asks your name, answer directly: you are Nexa.",
  "If the user asks who developed you, answer directly: Nexa Labs developed you.",
  "If the user asks what you do, describe yourself plainly as an AI assistant developed by Nexa Labs.",
  "Stay inside the user's stated stack, constraints, and topic unless they ask for alternatives.",
  "Do not introduce random tools, services, or frameworks that the user did not ask for.",
  "Do not jump to llama.cpp, Docker, WSL, Linux migration, CUDA toolkit changes, or extra infrastructure unless the user asked for them or they are truly necessary to answer correctly.",
  "Do not output stray non-English or non-Latin characters unless the user used them or the task requires them.",
  "For simple greetings or identity questions, answer in 1 to 2 short sentences.",
].join("\n");
const OUTPUT_STYLE_SYSTEM_PROMPT = [
  "Output style rules:",
  "Use clean plain text or simple Markdown only when it helps readability.",
  "Use short headings and bullet lists when useful, but avoid decorative formatting.",
  "For structured requests, start with the answer content directly, not with filler like 'Absolutely', 'Sure', or 'Let's start'.",
  "When headings help, prefer Markdown headings like '## Missing Information' or '## Recommendation'.",
  "Do not stack multiple formatting styles on the same heading. Use either a Markdown heading or bold text, not both.",
  "Do not output standalone divider lines like '---' unless they clearly improve readability.",
  "Do not use pipe-delimited layouts, pseudo-tables, ASCII grids, or separator art.",
  "Do not format comparisons as '| Column | Column |'. Use bullets instead.",
  "Do not chain multiple sections into one paragraph. Leave a blank line between sections.",
  "Do not use emoji in simple greetings, identity answers, or straightforward factual replies.",
  "Use emoji sparingly and only when they genuinely help the tone or clarity in longer structured answers.",
  "Do not use tables unless the user explicitly asks for one.",
  "Do not introduce broken characters, mojibake, or unusual symbols.",
  "Prefer standard punctuation and readable section labels.",
  "For planning, architecture, debugging, comparison, or tradeoff questions, give a fuller answer with concrete reasoning instead of a short summary.",
  "For explanation or teaching questions, do not answer with a one-line definition only.",
  "Teach with progression, not compression: start simple, then add intuition, then add an example only if it helps.",
  "Prefer 3 to 5 short sections over one dense paragraph when teaching or explaining.",
  "Avoid inline broken code or pseudo-code inside normal sentences. If code is needed, render a real fenced code block; otherwise explain without code.",
  "When the user asks a complex question, prefer 3 to 6 focused sections or bullets over a brief generic answer.",
  "For recommendation or setup questions, start with the direct answer first, then explain the reasoning and practical options.",
].join("\n");

const RESPONSE_MODE_TOKEN_BUDGETS = {
  fast: 768,
  think: 1536,
  deep: 2048,
};

const COMPLEXITY_KEYWORDS = [
  "explain",
  "simple terms",
  "what is",
  "how does",
  "teach me",
  "walk me through",
  "help me understand",
  "beginner",
  "compare",
  "analyze",
  "analyse",
  "design",
  "architecture",
  "business plan",
  "strategy",
  "review",
  "optimize",
  "optimise",
  "tradeoff",
  "tradeoffs",
  "scaling",
  "scale",
  "roadmap",
  "proposal",
  "walkthrough",
  "debug",
  "database",
  "system design",
];

const EXPLANATION_PROMPT_MARKERS = [
  "explain",
  "what is",
  "how does",
  "how do",
  "simple terms",
  "for a beginner",
  "beginner",
  "help me understand",
  "teach me",
];

const EXPLANATION_SYSTEM_PROMPT = [
  "Explanation mode:",
  "The user wants to understand a concept, not just get a short definition.",
  "Answer as a teacher would for a smart beginner.",
  "Use this teaching structure unless the user clearly wants something shorter:",
  "1. Short heading",
  "2. Definition",
  "3. Simple analogy",
  "4. Tiny code example only if it is genuinely useful",
  "5. Key takeaway",
  "Keep the answer in 3 to 5 short sections.",
  "Each section should be short and readable.",
  "Do not collapse the explanation into one dense paragraph.",
  "Do not use inline pseudo-code like code fragments mixed into prose.",
  "If a code example helps, keep it tiny and render it as a real fenced code block.",
  "If code does not help, skip it.",
  "Prefer plain language, concrete examples, and progression from basic idea to practical understanding.",
].join("\n");

const STRUCTURED_RESPONSE_PROMPT_MARKERS = [
  "architecture",
  "tradeoff",
  "tradeoffs",
  "compare",
  "comparison",
  "missing information",
  "what important information is missing",
  "keep the answer structured",
  "clear headings",
  "product scope",
  "technical design",
  "monetization",
  "recommendation",
];

const STRUCTURED_RESPONSE_SYSTEM_PROMPT = [
  "Structured response mode:",
  "The user wants a clean, readable, decision-oriented answer.",
  "Start with the first real section immediately. Do not open with conversational filler.",
  "Prefer this structure when relevant:",
  "1. Missing Information",
  "2. Assumptions",
  "3. Main Options or Tradeoffs",
  "4. Recommendation",
  "5. Next Steps",
  "Use concise bullets under short headings.",
  "Keep bullets concrete and decision-focused.",
  "Do not produce decorative separators, repeated headings, or markdown noise.",
  "Do not use tables, ASCII charts, pipe-separated rows, or scorecards unless the user explicitly asks for a table.",
  "For tradeoffs, use this pattern: option name, then 2 to 4 flat bullets for pros, cons, and best fit.",
  "For assumptions, use one bullet per assumption.",
  "For recommendations, write one short paragraph or 2 to 4 bullets, not a matrix.",
].join("\n");

const STRUCTURED_JSON_SYSTEM_PROMPT = [
  "Structured JSON mode:",
  "Return valid JSON only.",
  "Do not return Markdown.",
  "Do not return code fences.",
  "Do not include commentary before or after the JSON object.",
  "Use the exact field names from the schema.",
  "If a section is not relevant, return an empty array or empty string instead of inventing content.",
  "Keep every bullet item short, concrete, and plain.",
].join("\n");

const WEB_SEARCH_HINT_KEYWORDS = [
  "current",
  "latest",
  "today",
  "now",
  "recent",
  "news",
  "price",
  "net worth",
  "weather",
  "stock",
  "version",
  "ceo",
  "president",
  "what happened",
  "look up",
  "search the web",
  "online",
  "ipo",
  "secretary",
  "minister",
  "defense",
];

const APPWRITE_TIMEOUT_MS = 4000;

function supportsStreamingBackend(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "::1" ||
      parsed.hostname.endsWith(".trycloudflare.com")
    );
  } catch {
    return false;
  }
}

function shouldLikelySearchWeb(content) {
  const normalized = String(content || "").toLowerCase();
  return WEB_SEARCH_HINT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isImageGenerationPrompt(content) {
  const normalized = String(content || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return false;
  }

  const explicitImageIntent =
    /\b(create|generate|draw|paint|render|design|make|illustrate|visualize|visualise)\b.{0,80}\b(image|picture|photo|illustration|artwork|logo|poster|wallpaper|avatar|icon|sticker|scene)\b/.test(normalized) ||
    /\b(image|picture|photo|illustration|artwork|logo|poster|wallpaper|avatar|icon|sticker)\b.{0,60}\b(of|for|showing|featuring|with)\b/.test(normalized) ||
    /\b(3d|premium|modern|futuristic|minimalist|photorealistic|cartoon|anime)\b.{0,80}\b(logo|icon|avatar|poster|wallpaper|scene|image)\b/.test(normalized) ||
    /\b(logo|icon|avatar|poster|wallpaper|scene|image)\b.{0,80}\b(featuring|with|centered|glowing|metallic|glass|studio lighting|composition)\b/.test(normalized);

  if (explicitImageIntent) {
    return true;
  }

  const startsWithVisualCommand = /^(create|generate|draw|paint|render|design|make|illustrate)\b/.test(normalized);
  if (!startsWithVisualCommand) {
    return false;
  }

  const visualSubject =
    /\b(puppy|dog|cat|kitten|animal|character|mascot|person|portrait|landscape|city|room|house|car|robot|dragon|creature|product|object|scene|concept|cute|realistic|cartoon|anime|3d|orange|grey|gray|blue|red|green|purple)\b/.test(normalized);
  const nonImageArtifact =
    /\b(app|application|website|code|function|script|plan|roadmap|strategy|essay|article|email|message|document|database|api|architecture|business|schedule|task|list)\b/.test(normalized);

  return visualSubject && !nonImageArtifact;
}

function parseImageToolCallText(text) {
  const candidate = extractJsonObjectCandidate(text);
  if (!candidate) {
    return null;
  }

  const normalizedCandidate = candidate
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  const candidates = [
    normalizedCandidate,
    normalizedCandidate.replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
  ];

  for (const item of candidates) {
    try {
      const parsed = JSON.parse(item);
      if (typeof parsed === "string") {
        candidates.push(parsed.trim());
        continue;
      }

    const toolName = parsed.tool || parsed.$tool || parsed.name || parsed.tool_name;
    const args = parsed.args || parsed.arguments || parsed.parameters || {};
    if (
      (toolName === "generate_image" || toolName === "generateImage" || toolName === "generate-image") &&
      args &&
      typeof args === "object"
    ) {
      return args;
    }
    } catch {
      // Try the next normalization shape.
    }
  }

  return null;
}

function inferDirectImageArgs(content) {
  const normalized = String(content || "").toLowerCase();
  const isWide = /\b(landscape|wide|banner|hero|16:9)\b/.test(normalized);
  const isTall = /\b(vertical|poster|phone|story|9:16)\b/.test(normalized);
  const isIcon = /\b(icon|logo|app icon|browser icon|monogram|3d)\b/.test(normalized);
  return {
    prompt: content,
    aspect_ratio: isWide ? "16:9" : isTall ? "9:16" : "1:1",
    style: isIcon ? "render_3d" : "auto",
  };
}

function imageExtensionFromMime(mimeType) {
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

async function persistGeneratedImageAsset(imagePayload, { userId, conversationId, prompt }) {
  if (imagePayload?.url) {
    return {
      assetId: imagePayload.asset_id || "",
      imageId: imagePayload.image_id || buildGeneratedImageId(),
      imageUrl: imagePayload.url,
      r2Key: imagePayload.r2_key || "",
      format: imageExtensionFromMime(imagePayload.mime_type || "image/png"),
      mimeType: imagePayload.mime_type || "image/png",
      sizeBytes: Number(imagePayload.size_bytes || 0),
      filename: "",
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
  const filename = `${imageId}.${extension}`;
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

function assertGeneratedImageStorageConfigured() {
  try {
    ensureR2Config(r2UserStorageBucketName, "R2_USER_STORAGE_BUCKET_NAME");
  } catch (error) {
    throw new Error(
      `Image generation storage is not configured. Add Cloudflare R2 env vars before generating images: ${error?.message || error}`,
    );
  }
}

async function generateBackendImage(args) {
  const jobResponse = await fetch(`${BACKEND_URL}/v1/image/jobs`, {
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

  if (jobResponse.status === 404 || jobResponse.status === 405) {
    const directResponse = await fetch(`${BACKEND_URL}/v1/image/generate`, {
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

    if (!directResponse.ok) {
      throw new Error((await directResponse.text()) || `Image generation failed (${directResponse.status}).`);
    }

    return directResponse.json();
  }

  if (!jobResponse.ok) {
    throw new Error((await jobResponse.text()) || `Image generation failed (${jobResponse.status}).`);
  }

  const created = await jobResponse.json();
  const jobId = created?.job?.id;
  if (!jobId) {
    throw new Error("Image generation job did not return an id.");
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < 15 * 60 * 1000) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusResponse = await fetch(`${BACKEND_URL}/v1/image/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });

    if (!statusResponse.ok) {
      throw new Error((await statusResponse.text()) || `Image job status failed (${statusResponse.status}).`);
    }

    const job = await statusResponse.json();
    if (job.status === "failed") {
      throw new Error(job.error || "Image generation failed.");
    }
    if (job.status === "completed" && job.result) {
      return job.result;
    }
  }

  throw new Error("Image generation is still running. Try again in a moment.");
}

async function generateImageReply({ content, conversationId, userId }) {
  assertGeneratedImageStorageConfigured();

  const args = inferDirectImageArgs(content);
  const imagePayload = await generateBackendImage({
    ...args,
    raw_user_intent: content,
  });

  if (!imagePayload?.url && !imagePayload?.b64) {
    const fallbackArgs = parseImageToolCallText(imagePayload?.reply) || args;
    const fallbackImage = await generateBackendImage({
      ...fallbackArgs,
      raw_user_intent: content,
    });
    if (!fallbackImage?.url && !fallbackImage?.b64) {
      throw new Error("Image generation completed without an image payload.");
    }
    const stored = await persistGeneratedImageAsset(fallbackImage, {
      userId,
      conversationId,
      prompt: fallbackArgs.prompt || content,
    });
    return {
      reply: [
        `Generated image: ${fallbackImage.prompt_used || fallbackArgs.prompt || content}`,
        "",
        `![Generated image](${stored.imageUrl})`,
      ].join("\n").trim(),
      image: {
        ...fallbackImage,
        asset_id: stored.assetId,
        image_id: stored.imageId,
        url: stored.imageUrl,
        r2_key: stored.r2Key,
        format: stored.format,
        mime_type: stored.mimeType || fallbackImage.mime_type,
        size_bytes: stored.sizeBytes,
        filename: stored.filename,
        b64: undefined,
      },
      warnings: Array.isArray(fallbackImage.warnings) ? fallbackImage.warnings : [],
    };
  }

  const stored = await persistGeneratedImageAsset(imagePayload, {
    userId,
    conversationId,
    prompt: imagePayload.prompt_used || content,
  });
  const promptUsed = imagePayload.prompt_used || content;
  const reply = [
    `Generated image: ${promptUsed}`,
    "",
    `![Generated image](${stored.imageUrl})`,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  return {
    reply,
    image: {
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
    },
    warnings: Array.isArray(imagePayload.warnings) ? imagePayload.warnings : [],
  };
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPseudoTableHeaderCell(value) {
  const normalized = String(value || "")
    .replace(/[`*_#]/g, "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return true;
  }

  const headerLikeCells = new Set([
    "category",
    "decision",
    "option",
    "options",
    "approach",
    "model",
    "models",
    "feature",
    "features",
    "pros",
    "cons",
    "best fit",
    "best for",
    "feasibility",
    "scalability",
    "risk",
    "risks",
    "developer risk",
    "notes",
    "summary",
    "product scope",
    "technical design",
    "technical stack",
    "architecture",
    "monetization",
    "monetization strategy",
    "recommendation",
    "recommendation summary",
    "final recommendation",
    "final recommendation summary",
    "next steps",
  ]);

  return headerLikeCells.has(normalized);
}

function buildStructuredResponseUserPrompt(content) {
  return [
    "Answer the user's request using this exact JSON schema.",
    "Return one JSON object only.",
    "Do not use Markdown.",
    "Do not use code fences.",
    "",
    "Schema:",
    "{",
    '  "missing_information": ["short bullet"],',
    '  "assumptions": ["short bullet"],',
    '  "tradeoff_sections": [',
    "    {",
    '      "title": "section title",',
    '      "options": [',
    "        {",
    '          "name": "option name",',
    '          "pros": ["short bullet"],',
    '          "cons": ["short bullet"],',
    '          "best_fit": "one short sentence",',
    '          "recommended": true',
    "        }",
    "      ]",
    "    }",
    "  ],",
    '  "recommendation": {',
    '    "summary": "one short paragraph",',
    '    "decisions": [',
    "      {",
    '        "area": "area name",',
    '        "choice": "chosen option",',
    '        "reason": "one short reason"',
    "      }",
    "    ]",
    "  },",
    '  "next_steps": ["short action item"]',
    "}",
    "",
    "Rules:",
    "- Use arrays of short strings for bullet content.",
    "- Keep tradeoff sections grouped by area such as Product Scope, Technical Design, or Monetization.",
    "- If the user asks for comparisons, put them inside tradeoff_sections.",
    "- recommendation.summary should be 1 short paragraph.",
    "- recommendation.decisions should be concise.",
    "",
    "User request:",
    content,
  ].join("\n");
}

function extractJsonObjectCandidate(text) {
  const source = String(text || "").trim();
  if (!source) {
    return "";
  }

  const fencedMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return source.slice(start, end + 1).trim();
  }

  return source;
}

function tryParseStructuredJson(reply) {
  const candidate = extractJsonObjectCandidate(reply)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  if (!candidate.startsWith("{") || !candidate.endsWith("}")) {
    return null;
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function toStringList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        typeof item === "string"
          ? [item]
          : item && typeof item === "object" && typeof item.text === "string"
            ? [item.text]
            : [],
      )
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|;/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeTradeoffSections(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section) => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const title = String(section.title || section.category || section.area || "").trim();
      const options = Array.isArray(section.options)
        ? section.options
            .map((option) => {
              if (!option || typeof option !== "object") {
                return null;
              }

              const name = String(option.name || option.option || option.title || "").trim();
              if (!name) {
                return null;
              }

              return {
                name,
                pros: toStringList(option.pros),
                cons: toStringList(option.cons),
                bestFit: String(option.best_fit || option.bestFor || option.best_fit_for || "").trim(),
                recommended:
                  option.recommended === true ||
                  String(option.recommended || "").toLowerCase() === "true",
                note: String(
                  option.recommendation_note || option.note || option.reason || option.notes || "",
                ).trim(),
              };
            })
            .filter(Boolean)
        : [];

      if (!title || options.length === 0) {
        return null;
      }

      return { title, options };
    })
    .filter(Boolean);
}

function renderStructuredMarkdownFromJson(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  const lines = [];
  const pushSection = (title) => {
    if (lines.length > 0 && lines[lines.length - 1] !== "") {
      lines.push("");
    }
    lines.push(`## ${title}`);
  };

  const missingInformation = toStringList(data.missing_information);
  if (missingInformation.length > 0) {
    pushSection("Missing Information");
    missingInformation.forEach((item) => lines.push(`- ${item}`));
  }

  const assumptions = toStringList(data.assumptions);
  if (assumptions.length > 0) {
    pushSection("Assumptions");
    assumptions.forEach((item) => lines.push(`- ${item}`));
  }

  const tradeoffSections = normalizeTradeoffSections(data.tradeoff_sections);
  if (tradeoffSections.length > 0) {
    pushSection("Main Tradeoffs");
    for (const section of tradeoffSections) {
      lines.push(`### ${section.title}`);
      lines.push("");
      for (const option of section.options) {
        lines.push(`**${option.name}**`);
        option.pros.forEach((item) => lines.push(`- Pros: ${item}`));
        option.cons.forEach((item) => lines.push(`- Cons: ${item}`));
        if (option.bestFit) {
          lines.push(`- Best fit: ${option.bestFit}`);
        }
        if (option.note) {
          lines.push(`- Note: ${option.note}`);
        }
        if (option.recommended) {
          lines.push(`- Recommended: Yes`);
        }
        lines.push("");
      }
      while (lines[lines.length - 1] === "") {
        lines.pop();
      }
      lines.push("");
    }
    while (lines[lines.length - 1] === "") {
      lines.pop();
    }
  }

  const recommendation = data.recommendation && typeof data.recommendation === "object"
    ? data.recommendation
    : null;
  const recommendationSummary = String(recommendation?.summary || "").trim();
  const recommendationDecisions = Array.isArray(recommendation?.decisions)
    ? recommendation.decisions
        .map((decision) => {
          if (!decision || typeof decision !== "object") {
            return null;
          }

          const area = String(decision.area || "").trim();
          const choice = String(decision.choice || "").trim();
          const reason = String(decision.reason || "").trim();

          if (!area && !choice && !reason) {
            return null;
          }

          return { area, choice, reason };
        })
        .filter(Boolean)
    : [];

  if (recommendationSummary || recommendationDecisions.length > 0) {
    pushSection("Recommendation");
    if (recommendationSummary) {
      lines.push(recommendationSummary);
    }
    recommendationDecisions.forEach((decision) => {
      const label = [decision.area, decision.choice].filter(Boolean).join(": ");
      if (label && decision.reason) {
        lines.push(`- ${label} - ${decision.reason}`);
      } else if (label) {
        lines.push(`- ${label}`);
      } else if (decision.reason) {
        lines.push(`- ${decision.reason}`);
      }
    });
  }

  const nextSteps = toStringList(data.next_steps);
  if (nextSteps.length > 0) {
    pushSection("Next Steps");
    nextSteps.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function repairStructuredReplyToJson(rawReply, userContent) {
  const repairPrompt = [
    "Convert the following assistant answer into valid JSON that matches this schema.",
    "Return JSON only.",
    "Do not use Markdown.",
    "Do not use code fences.",
    "",
    "Schema:",
    "{",
    '  "missing_information": ["short bullet"],',
    '  "assumptions": ["short bullet"],',
    '  "tradeoff_sections": [{"title": "section title", "options": [{"name": "option name", "pros": ["short bullet"], "cons": ["short bullet"], "best_fit": "one short sentence", "recommended": true}]}],',
    '  "recommendation": {"summary": "one short paragraph", "decisions": [{"area": "area name", "choice": "chosen option", "reason": "one short reason"}]},',
    '  "next_steps": ["short action item"]',
    "}",
    "",
    "Original user request:",
    userContent,
    "",
    "Assistant answer to convert:",
    rawReply,
  ].join("\n");

  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: repairPrompt,
        system_prompt: STRUCTURED_JSON_SYSTEM_PROMPT,
        max_new_tokens: 1024,
        temperature: 0.1,
        top_p: 0.9,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return tryParseStructuredJson(data.reply);
  } catch {
    return null;
  }
}

function normalizeStructuredReplyFormatting(reply) {
  const knownSectionTitles = [
    "Missing Information",
    "Assumptions",
    "Main Tradeoffs",
    "Product Scope Tradeoffs",
    "Technical Design",
    "Architecture",
    "Monetization Strategy",
    "Monetization Strategy Comparison",
    "Final Recommendation Summary",
    "Recommendation Summary",
    "Recommendation",
    "Next Steps",
  ];
  const knownSubsectionTitles = [
    "Product Scope",
    "Technical Architecture",
    "Technical Design",
    "Monetization",
    "Monetization Strategy",
    "Business Model",
    "Recommendation Summary",
    "Final Recommendation Summary",
  ];
  const headingTitles = new Set([...knownSectionTitles, ...knownSubsectionTitles]);

  let text = String(reply || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return text;
  }

  text = text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bNexalabs\b/g, "Nexa Labs")
    .replace(/\bassistantdeveloped\b/g, "assistant developed")
    .replace(/^(#{1,6})([^#\s])/gm, "$1 $2")
    .replace(/\s+(#{1,6}\s+)/g, "\n\n$1")
    .replace(/^\s*(?:\|\s*)?(?:[-:|+]\s*){3,}\|?\s*$/gm, "")
    .replace(/\n(?:\s*---+\s*\n)+/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  for (const title of knownSectionTitles) {
    const escaped = escapeRegExp(title);
    text = text.replace(
      new RegExp(`^${escaped}\\s*[-:]\\s*(.+)$`, "gmi"),
      `## ${title}\n- $1`,
    );
  }

  const sectionPattern = knownSectionTitles
    .sort((left, right) => right.length - left.length)
    .map((title) => escapeRegExp(title))
    .join("|");

  const rewrittenLines = [];
  const pushBlankLine = () => {
    if (rewrittenLines[rewrittenLines.length - 1] !== "") {
      rewrittenLines.push("");
    }
  };
  const pushContentLine = (line) => {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      pushBlankLine();
      return;
    }
    rewrittenLines.push(trimmed);
  };
  const pushSection = (title, body = []) => {
    pushBlankLine();
    rewrittenLines.push(`## ${title}`);
    const items = Array.isArray(body) ? body : [body];
    for (const item of items) {
      const trimmed = String(item || "").trim();
      if (!trimmed) {
        continue;
      }
      rewrittenLines.push(trimmed.startsWith("- ") ? trimmed : `- ${trimmed}`);
    }
  };

  const processLine = (rawLine) => {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) {
      pushBlankLine();
      return;
    }

    const splitHeadingLine = trimmedLine
      .replace(/\s+(?=#{1,6}\s+)/g, "\n")
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);

    if (splitHeadingLine.length > 1) {
      splitHeadingLine.forEach((part) => processLine(part));
      return;
    }

    let line = splitHeadingLine[0]
      .replace(/^#{3,6}\s*/g, "## ")
      .replace(/^\s*[>→]\s*/g, "- ")
      .replace(/^\s*[-*]\s*(?=[A-Z][A-Za-z ]+:\s)/g, "- ")
      .replace(/\|{2,}/g, "|")
      .replace(/\s*\|\s*/g, " | ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!line) {
      pushBlankLine();
      return;
    }

    if (/^[-—–_]+$/.test(line)) {
      pushBlankLine();
      return;
    }

    const emphasizedLineMatch = line.match(/^([*_]{1,2})(.+)\1$/);
    if (emphasizedLineMatch) {
      const inner = emphasizedLineMatch[2].trim().replace(/\s+/g, " ");
      if (inner && !/[.!?]/.test(inner)) {
        pushBlankLine();
        pushContentLine(`### ${inner}`);
        return;
      }
      line = inner;
    }

    const sectionMatch = line.match(
      new RegExp(`^(?:#{1,6}\\s*)?(${sectionPattern})\\s*[-:]?\\s*(.*)$`, "i"),
    );

    if (sectionMatch) {
      const [, matchedTitle, remainder = ""] = sectionMatch;
      const exactTitle =
        knownSectionTitles.find((title) => title.toLowerCase() === matchedTitle.toLowerCase()) ||
        matchedTitle;
      const cleanedRemainder = remainder
        .replace(/^#{1,6}\s+/g, "")
        .replace(/^\|\s*/g, "")
        .replace(/\s*\|$/g, "")
        .trim();

      if (!cleanedRemainder) {
        pushBlankLine();
        pushContentLine(`## ${exactTitle}`);
        return;
      }

      const semicolonSegments = cleanedRemainder
        .split(/\s*;\s*/)
        .map((segment) => segment.trim())
        .filter(Boolean);

      if (
        semicolonSegments.length >= 2 &&
        !semicolonSegments.every((segment) => isPseudoTableHeaderCell(segment))
      ) {
        pushSection(exactTitle, semicolonSegments);
      } else {
        pushSection(exactTitle, cleanedRemainder);
      }
      return;
    }

    if (line.includes("|")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      if (cells.length >= 2) {
        if (cells.every((cell) => isPseudoTableHeaderCell(cell))) {
          return;
        }

        const [title, ...rest] = cells;
        if (isPseudoTableHeaderCell(title) && rest.length) {
          pushBlankLine();
          pushContentLine(`${knownSectionTitles.includes(title) ? "##" : "###"} ${title}`);
          rest
            .filter((cell) => !isPseudoTableHeaderCell(cell))
            .forEach((cell) => pushContentLine(cell.startsWith("- ") ? cell : `- ${cell}`));
          return;
        }

        if (rest.length === 2) {
          pushBlankLine();
          pushContentLine(`### ${title}`);
          pushContentLine(`- Pros: ${rest[0]}`);
          pushContentLine(`- Cons: ${rest[1]}`);
          return;
        }

        if (rest.length >= 3) {
          pushBlankLine();
          pushContentLine(`### ${title}`);
          pushContentLine(`- Pros: ${rest[0]}`);
          pushContentLine(`- Cons: ${rest[1]}`);
          pushContentLine(`- Best fit: ${rest[2]}`);
          rest.slice(3).forEach((cell) => pushContentLine(`- Notes: ${cell}`));
          return;
        }
      }
    }

    const semicolonSegments = line
      .split(/\s*;\s*/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (
      semicolonSegments.length >= 3 &&
      !/[.!?]/.test(line) &&
      !semicolonSegments.every((segment) => isPseudoTableHeaderCell(segment))
    ) {
      const [first, second, third, ...rest] = semicolonSegments;
      if (rest.length === 0) {
        pushBlankLine();
        pushContentLine(`### ${first}`);
        pushContentLine(`- Pros: ${second}`);
        pushContentLine(`- Cons: ${third}`);
      } else {
        pushBlankLine();
        pushContentLine(`### ${first}`);
        pushContentLine(`- ${second}`);
        pushContentLine(`- ${third}`);
        rest.forEach((segment) => pushContentLine(`- ${segment}`));
      }
      return;
    }

    if (headingTitles.has(line)) {
      pushBlankLine();
      pushContentLine(`${knownSectionTitles.includes(line) ? "##" : "###"} ${line}`);
      return;
    }

    line = line
      .replace(/##\s+/g, "\n\n## ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    pushContentLine(line);
  };

  for (const rawLine of text.split("\n")) {
    processLine(rawLine);
  }

  text = rewrittenLines.join("\n");

  text = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([^\n])\n(##|###)\s/g, "$1\n\n$2 ")
    .replace(/\n(## [^\n]+)\n(?=## )/g, "\n$1\n\n")
    .replace(/\n(### [^\n]+)\n(?=### )/g, "\n$1\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n- (##|###)\s+/g, "\n$1 ")
    .replace(/^\s*-\s*$/gm, "")
    .trim();

  return text.trim();
}

async function formatAssistantReply(reply, userContent) {
  if (isStructuredResponsePrompt(userContent)) {
    const parsed = tryParseStructuredJson(reply);
    if (parsed) {
      const rendered = renderStructuredMarkdownFromJson(parsed);
      if (rendered) {
        return rendered;
      }
    }

    const repaired = await repairStructuredReplyToJson(reply, userContent);
    if (repaired) {
      const rendered = renderStructuredMarkdownFromJson(repaired);
      if (rendered) {
        return rendered;
      }
    }

    return normalizeStructuredReplyFormatting(reply);
  }

  if (isExplanationPrompt(userContent)) {
    return normalizeStructuredReplyFormatting(reply);
  }

  return String(reply || "").trim();
}

function shouldUseStreamingBackend(content) {
  if (!supportsStreamingBackend(BACKEND_URL)) {
    return false;
  }

  // Web-grounded prompts are more reliable through the non-stream backend path
  // on the local 4B model.
  if (shouldLikelySearchWeb(content)) {
    return false;
  }

  // Structured planning and architecture answers look substantially better when
  // we wait for the full response instead of exposing partial stream fragments.
  if (isStructuredResponsePrompt(content) || isExplanationPrompt(content)) {
    return false;
  }

  return true;
}

async function proxyLegacyChat(body) {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    },
  });
}

async function getBackendConfig() {
  const response = await fetch(`${BACKEND_URL}/ui-config`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load backend config (${response.status}).`);
  }
  return response.json();
}

function sseEvent(event, payload) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function inferImagePlanning(content) {
  const prompt = String(content || "").trim();
  const lower = prompt.toLowerCase();
  const isIcon = /\b(icon|logo|app icon|browser icon|monogram)\b/.test(lower);
  const isPortrait = /\b(portrait|headshot|person|face)\b/.test(lower);
  const isWide = /\b(landscape|wide|banner|hero|16:9)\b/.test(lower);
  const isTall = /\b(vertical|poster|phone|story|9:16)\b/.test(lower);
  const aspectRatio = isWide ? "16:9" : isTall ? "9:16" : "1:1";
  const style = isIcon
    ? "premium 3D icon"
    : isPortrait
      ? "polished portrait"
      : /\b(cartoon|pixar|anime|illustration)\b/.test(lower)
        ? "illustration"
        : /\b(realistic|photo|photorealistic)\b/.test(lower)
          ? "realistic"
          : "clean visual design";
  const titleSubject = isIcon
    ? prompt.replace(/^(create|generate|make|design)\s+/i, "").replace(/[.!?]+$/g, "")
    : "image";

  return {
    aspectRatio,
    style,
    subject: titleSubject || "image",
    title: isIcon ? `Designing ${titleSubject}` : "Designing image",
    detail: isIcon
      ? `Choosing a ${aspectRatio} layout with a readable focal shape, premium materials, clean silhouette, and an uncluttered background.`
      : `Planning the composition, image detail, ${style} style, and ${aspectRatio} aspect ratio before rendering.`,
  };
}

function buildImageProgressFrames(imagePlanning) {
  return [
    {
      status: "thinking",
      progress: 10,
      title: "Thinking",
      detail: `Understanding the request and deciding the image direction for ${imagePlanning.subject}.`,
    },
    {
      status: "designing",
      progress: 24,
      title: imagePlanning.title,
      detail: imagePlanning.detail,
    },
    {
      status: "detailing",
      progress: 42,
      title: "Refining image details",
      detail: `Balancing subject clarity, lighting, background, and ${imagePlanning.style} styling.`,
    },
    {
      status: "rendering",
      progress: 66,
      title: "Generating image",
      detail: "Rendering the image now. This can take a moment on the local model.",
    },
    {
      status: "finishing",
      progress: 84,
      title: "Finishing image",
      detail: "Saving the generated image and preparing it for the chat.",
    },
  ];
}

function parseUpstreamSseEvents(buffer) {
  const normalized = String(buffer || "").replace(/\r\n/g, "\n");
  const parts = normalized.split("\n\n");
  const remainder = parts.pop() || "";
  const events = [];

  for (const part of parts) {
    const lines = part.split("\n");
    let event = "message";
    const dataLines = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    const data = dataLines.join("\n").trim();
    if (!data || data === "[DONE]") {
      continue;
    }

    try {
      events.push({ event, data: JSON.parse(data) });
    } catch {
      events.push({ event, data: { type: "chunk", text: data } });
    }
  }

  return { events, remainder };
}

function normalizeBackendStreamEvent(data) {
  if (!data || typeof data !== "object") {
    return { type: "ignore" };
  }

  if (data.type === "metadata") {
    return {
      type: "metadata",
      used_web_search: Boolean(data.used_web_search),
      source_confidence: data.source_confidence || "none",
      sources: Array.isArray(data.sources) ? data.sources : [],
    };
  }

  if (data.type === "chunk") {
    return { type: "token", text: String(data.text || "") };
  }

  if (data.type === "final") {
    return {
      type: "final",
      text: typeof data.text === "string" ? data.text : "",
      error: data.error || null,
    };
  }

  if (data.type === "error" || data.error) {
    return { type: "error", error: data.error || "Streaming backend failed." };
  }

  const delta = data.choices?.[0]?.delta?.content;
  if (typeof delta === "string") {
    return { type: "token", text: delta };
  }

  return { type: "ignore" };
}

async function withTimeout(promise, timeoutMs, fallbackValue) {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/["'`]/g, "")
    .replace(/["'.:!?]/g, "")
    .replace(/\b(I Want|I Need|Help Me|Create|Build|Make|Trying To)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeGeneratedTitle(rawTitle, fallbackMessage) {
  const cleaned = cleanTitle(rawTitle)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  if (!cleaned) {
    return buildConversationTitle(fallbackMessage);
  }

  const words = cleaned.split(" ").filter(Boolean).slice(0, 5);
  if (words.length === 0) {
    return buildConversationTitle(fallbackMessage);
  }

  const weakPrefixes = [
    ["i", "want"],
    ["i", "need"],
    ["help", "me"],
    ["can", "you"],
    ["tell", "me"],
    ["show", "me"],
  ];
  const lowerWords = words.map((word) => word.toLowerCase());
  const hasWeakPrefix = weakPrefixes.some(
    ([first, second]) => lowerWords[0] === first && lowerWords[1] === second,
  );
  if (hasWeakPrefix || words.length < 2) {
    return buildConversationTitle(fallbackMessage);
  }

  const normalized = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return normalized || buildConversationTitle(fallbackMessage);
}

async function generateConversationTitle(userMessage, assistantReply, systemPrompt) {
  const fallback = buildConversationTitle(`${userMessage} ${assistantReply}`.trim());
  const titlePrompt = `
Generate a short chat title.

Rules:
- 2 to 5 words only
- Title Case
- No punctuation
- Do not copy the user's sentence
- Summarize the main topic
- Remove filler words like "I want", "help me", "create", "build"

User Message:
${userMessage}

Return only the title.
`;

  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: titlePrompt,
        system_prompt:
          systemPrompt ||
          "You generate concise conversation titles that follow the user's formatting rules exactly.",
        max_new_tokens: TITLE_MAX_NEW_TOKENS,
        temperature: 0.1,
        top_p: 0.9,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const generated = sanitizeGeneratedTitle(data.reply, `${userMessage} ${assistantReply}`.trim());
    return generated || fallback;
  } catch {
    return fallback;
  }
}

function chooseResponseMode(prompt) {
  const normalized = String(prompt || "").toLowerCase();
  const length = normalized.length;
  let score = 0;

  if (length >= 500) {
    score += 3;
  } else if (length >= 250) {
    score += 2;
  } else if (length >= 100) {
    score += 1;
  }

  for (const keyword of COMPLEXITY_KEYWORDS) {
    if (normalized.includes(keyword)) {
      score += keyword.includes(" ") ? 2 : 1;
    }
  }

  if (
    normalized.startsWith("explain ") ||
    normalized.startsWith("what is ") ||
    normalized.startsWith("how does ") ||
    normalized.includes(" in simple terms")
  ) {
    score += 2;
  }

  if (score >= 4) {
    return "deep";
  }

  if (score >= 1) {
    return "think";
  }

  return length >= 60 ? "think" : "fast";
}

function isExplanationPrompt(prompt) {
  const normalized = String(prompt || "").toLowerCase();
  return EXPLANATION_PROMPT_MARKERS.some((marker) => normalized.includes(marker));
}

function isStructuredResponsePrompt(prompt) {
  const normalized = String(prompt || "").toLowerCase();
  return STRUCTURED_RESPONSE_PROMPT_MARKERS.some((marker) => normalized.includes(marker));
}

async function persistMemorySafely(userId, content, fallbackMemory) {
  try {
    return await extractAndPersistMemory(userId, content);
  } catch {
    return fallbackMemory;
  }
}

export async function POST(request) {
  const body = await request.json();

  if (Array.isArray(body.messages) && !body.message) {
    return proxyLegacyChat(body);
  }

  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const content = String(body.message || "").trim();
  if (!content) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const requestedMaxNewTokens = Number(body.max_new_tokens || 0);
  const maxNewTokens =
    requestedMaxNewTokens > 0
      ? requestedMaxNewTokens
      : RESPONSE_MODE_TOKEN_BUDGETS[chooseResponseMode(content)] || DEFAULT_MAX_NEW_TOKENS;
  const wantsStream = Boolean(body.stream);
  const structuredResponseRequested = isStructuredResponsePrompt(content);
  const explanationRequested = isExplanationPrompt(content);
  const modelTemperature = structuredResponseRequested ? 0.2 : DEFAULT_TEMPERATURE;
  const currentUserPromptForModel = structuredResponseRequested
    ? buildStructuredResponseUserPrompt(content)
    : content;
  let conversationId = body.conversationId ? String(body.conversationId) : "";
  const isNewConversation = !conversationId;

  try {
    if (!conversationId) {
      const conversation = await createConversation(auth.user.$id, content);
      conversationId = conversation.$id;
    }

    const savedUserMessage = await saveMessage({
      userId: auth.user.$id,
      conversationId,
      role: "user",
      content,
    });

    const fallbackConversationData = {
      conversation: {
        $id: conversationId,
        title: DEFAULT_CONVERSATION_TITLE,
        updatedAt: savedUserMessage.createdAt || new Date().toISOString(),
        lastMessagePreview: content.slice(0, 120),
      },
      messages: [{ role: "user", content }],
    };

    const [initialMemory, conversationData, backendConfig] = await Promise.all([
      withTimeout(
        getUserMemory(auth.user.$id),
        APPWRITE_TIMEOUT_MS,
        {
          displayName: "",
          preferredTone: "",
          interests: [],
          customInstructions: "",
          facts: [],
          updatedAt: null,
        },
      ),
      isNewConversation
        ? Promise.resolve(fallbackConversationData)
        : withTimeout(
            getConversation(auth.user.$id, conversationId),
            APPWRITE_TIMEOUT_MS,
            fallbackConversationData,
          ),
      getBackendConfig(),
    ]);
    const needsGeneratedTitle =
      !conversationData.conversation.title ||
      conversationData.conversation.title === DEFAULT_CONVERSATION_TITLE;

    const memoryPrompt = buildMemorySystemPrompt(initialMemory);
    const recentConversationMessages = conversationData.messages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    if (recentConversationMessages.length > 0) {
      const lastMessage = recentConversationMessages[recentConversationMessages.length - 1];
      if (lastMessage.role === "user" && String(lastMessage.content || "").trim() === content) {
        lastMessage.content = currentUserPromptForModel;
      } else {
        recentConversationMessages.push({ role: "user", content: currentUserPromptForModel });
      }
    } else {
      recentConversationMessages.push({ role: "user", content: currentUserPromptForModel });
    }

    const modelMessages = [
      { role: "system", content: backendConfig.system_prompt || "You are a helpful assistant." },
      { role: "system", content: CONTINUITY_SYSTEM_PROMPT },
      { role: "system", content: GROUNDING_SYSTEM_PROMPT },
      { role: "system", content: OUTPUT_STYLE_SYSTEM_PROMPT },
      ...(explanationRequested ? [{ role: "system", content: EXPLANATION_SYSTEM_PROMPT }] : []),
      ...(structuredResponseRequested
        ? [
            { role: "system", content: STRUCTURED_RESPONSE_SYSTEM_PROMPT },
            { role: "system", content: STRUCTURED_JSON_SYSTEM_PROMPT },
          ]
        : []),
      ...(memoryPrompt ? [{ role: "system", content: memoryPrompt }] : []),
      ...recentConversationMessages,
    ];

    if (isImageGenerationPrompt(content)) {
      const runImageGeneration = async () => {
        const imageResult = await generateImageReply({
          content,
          conversationId,
          userId: auth.user.$id,
        });
        const reply = imageResult.reply;

        const savedAssistantMessage = await saveMessage({
          userId: auth.user.$id,
          conversationId,
          role: "assistant",
          content: reply,
        });

        if (imageResult.image?.image_id && imageResult.image?.r2_key) {
          try {
            await saveStorageAssetRecord({
              assetId: imageResult.image.asset_id || "",
              userId: auth.user.$id,
              tenantId: "personal",
              assetType: "image",
              category: "generated",
              filename: imageResult.image.filename || `${imageResult.image.image_id}.${imageResult.image.format || "png"}`,
              mimeType: imageResult.image.mime_type || "image/png",
              sizeBytes: Number(imageResult.image.size_bytes || 0),
              bucket: r2UserStorageBucketName,
              r2Key: imageResult.image.r2_key,
              visibility: "private",
            });
            await saveGeneratedImageRecord({
              imageId: imageResult.image.image_id,
              assetId: imageResult.image.asset_id || "",
              userId: auth.user.$id,
              tenantId: "personal",
              conversationId,
              messageId: savedAssistantMessage.$id || savedAssistantMessage.id || "",
              prompt: content,
              revisedPrompt: imageResult.image.prompt_used || content,
              model: imageResult.image.model || "nexa-image-v1",
              provider: imageResult.image.backend || "local",
              seed: imageResult.image.seed ?? null,
              format: imageResult.image.format || imageExtensionFromMime(imageResult.image.mime_type),
              sizeBytes: Number(imageResult.image.size_bytes || 0),
              bucket: r2UserStorageBucketName,
              r2Key: imageResult.image.r2_key,
              thumbnailKey: imageResult.image.thumbnail_key || "",
              imageUrl: imageResult.image.url || "",
              status: "completed",
              visibility: "private",
            });
            await incrementStorageUsage({
              userId: auth.user.$id,
              tenantId: "personal",
              sizeBytes: Number(imageResult.image.size_bytes || 0),
              assetType: "image",
            });
          } catch (error) {
            console.warn("Generated image metadata save failed:", error?.message || error);
          }
        }

        const resolvedTitle = needsGeneratedTitle
          ? await generateConversationTitle(content, reply, backendConfig.system_prompt)
          : conversationData.conversation.title;

        const updatedConversation = await updateConversationSummary(conversationId, auth.user.$id, {
          title: resolvedTitle,
          lastMessagePreview: `Generated image: ${content}`.slice(0, 120),
        });
        const updatedMemory = await persistMemorySafely(auth.user.$id, content, initialMemory);

        return {
          reply,
          conversationId,
          conversation: updatedConversation,
          memory: updatedMemory,
          userMessage: savedUserMessage,
          assistantMessage: savedAssistantMessage,
          source_confidence: "none",
          used_web_search: false,
          sources: [],
          image: imageResult.image,
          warnings: imageResult.warnings,
        };
      };

      if (wantsStream) {
        const imagePlanning = inferImagePlanning(content);
        const progressFrames = buildImageProgressFrames(imagePlanning);
        const initialConversation = {
          $id: conversationId,
          title: conversationData.conversation.title || DEFAULT_CONVERSATION_TITLE,
          updatedAt: conversationData.conversation.updatedAt || conversationData.conversation.$updatedAt || "",
          lastMessagePreview: `Generating image: ${content}`.slice(0, 120),
        };

        const job = startImageGenerationJob({
          userId: auth.user.$id,
          conversationId,
          initialStatus: {
            ...progressFrames[0],
            aspect_ratio: imagePlanning.aspectRatio,
            style: imagePlanning.style,
          },
          execute: async ({ updateProgress }) => {
            let progressIndex = 1;
            const progressTimer = setInterval(() => {
              const frame =
                progressFrames[Math.min(progressIndex, progressFrames.length - 2)];
              progressIndex += 1;
              updateProgress({
                ...frame,
                aspect_ratio: imagePlanning.aspectRatio,
                style: imagePlanning.style,
              });
            }, 2000);

            let result;
            try {
              updateProgress({
                ...progressFrames[1],
                aspect_ratio: imagePlanning.aspectRatio,
                style: imagePlanning.style,
              });
              result = await runImageGeneration();
            } finally {
              clearInterval(progressTimer);
            }

            updateProgress({
              ...progressFrames[progressFrames.length - 1],
              aspect_ratio: imagePlanning.aspectRatio,
              style: imagePlanning.style,
            });
            return result;
          },
        });

        return Response.json(
          {
            conversationId,
            conversation: initialConversation,
            memory: initialMemory,
            userMessage: savedUserMessage,
            imageJob: {
              id: job.id,
              status: job.status,
              progress: job.progress,
              title: job.title,
              detail: job.detail,
              aspect_ratio: job.aspect_ratio,
              style: job.style,
              pollUrl: `/api/image-jobs/${job.id}`,
            },
          },
          {
            status: 202,
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );
      }

      return Response.json(await runImageGeneration());
    }

    if (wantsStream && shouldUseStreamingBackend(content)) {
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: modelMessages,
            max_new_tokens: maxNewTokens,
            temperature: modelTemperature,
            top_p: DEFAULT_TOP_P,
          }),
          cache: "no-store",
        });

        if (!backendResponse.ok || !backendResponse.body) {
          throw new Error("Streaming backend unavailable.");
        }

        const initialConversation = {
          $id: conversationId,
          title: conversationData.conversation.title || DEFAULT_CONVERSATION_TITLE,
          updatedAt: conversationData.conversation.updatedAt || conversationData.conversation.$updatedAt || "",
          lastMessagePreview: "",
        };

        const stream = new ReadableStream({
          async start(controller) {
            let reply = "";
            let backendMetadata = { used_web_search: false, source_confidence: "none", sources: [] };
            const reader = backendResponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            const backendContentType = backendResponse.headers.get("Content-Type") || "";
            const upstreamIsSse = backendContentType.includes("text/event-stream");

            controller.enqueue(
              sseEvent("meta", {
                conversationId,
                conversation: initialConversation,
                userMessage: savedUserMessage,
                memory: initialMemory,
              }),
            );

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  break;
                }

                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) {
                  continue;
                }

                buffer += chunk;

                if (upstreamIsSse) {
                  const parsed = parseUpstreamSseEvents(buffer);
                  buffer = parsed.remainder;

                  for (const event of parsed.events) {
                    const normalized = normalizeBackendStreamEvent(event.data);

                    if (normalized.type === "metadata") {
                      backendMetadata = {
                        used_web_search: normalized.used_web_search,
                        source_confidence: normalized.source_confidence,
                        sources: normalized.sources,
                      };
                    } else if (normalized.type === "token" && normalized.text) {
                      reply += normalized.text;
                      controller.enqueue(sseEvent("token", { text: normalized.text }));
                    } else if (normalized.type === "final") {
                      if (normalized.error) {
                        throw new Error(normalized.error);
                      }
                      if (!reply && normalized.text) {
                        reply = normalized.text;
                        controller.enqueue(sseEvent("token", { text: normalized.text }));
                      }
                    } else if (normalized.type === "error") {
                      throw new Error(normalized.error);
                    }
                  }
                } else if (!reply && buffer.includes("\n")) {
                  // C:\Nexa guide backend sends one JSON metadata line, then plain text chunks.
                  const lineEnd = buffer.indexOf("\n");
                  const line = buffer.substring(0, lineEnd);
                  buffer = buffer.substring(lineEnd + 1);
                  
                  try {
                    const meta = JSON.parse(line);
                    if (meta.type === "metadata") {
                      backendMetadata = {
                        used_web_search: meta.used_web_search || false,
                        source_confidence: meta.source_confidence || "none",
                        sources: meta.sources || [],
                      };
                    }
                  } catch {
                    // Not JSON, treat as text
                    reply += line + "\n";
                    controller.enqueue(sseEvent("token", { text: line + "\n" }));
                  }
                } else {
                  reply += chunk;
                  controller.enqueue(sseEvent("token", { text: chunk }));
                }
              }

              if (upstreamIsSse && buffer.trim()) {
                const parsed = parseUpstreamSseEvents(`${buffer}\n\n`);
                for (const event of parsed.events) {
                  const normalized = normalizeBackendStreamEvent(event.data);
                  if (normalized.type === "token" && normalized.text) {
                    reply += normalized.text;
                    controller.enqueue(sseEvent("token", { text: normalized.text }));
                  } else if (normalized.type === "final") {
                    if (normalized.error) {
                      throw new Error(normalized.error);
                    }
                    if (!reply && normalized.text) {
                      reply = normalized.text;
                      controller.enqueue(sseEvent("token", { text: normalized.text }));
                    }
                  } else if (normalized.type === "error") {
                    throw new Error(normalized.error);
                  }
                }
              } else if (!upstreamIsSse && buffer) {
                reply += buffer;
                controller.enqueue(sseEvent("token", { text: buffer }));
              }

              reply = reply.trim();

              const savedAssistantMessage = await saveMessage({
                userId: auth.user.$id,
                conversationId,
                role: "assistant",
                content: reply,
              });

              const resolvedTitle = needsGeneratedTitle
                ? await generateConversationTitle(content, reply, backendConfig.system_prompt)
                : conversationData.conversation.title;

              const updatedConversation = await updateConversationSummary(conversationId, auth.user.$id, {
                title: resolvedTitle,
                lastMessagePreview: reply.slice(0, 120),
              });

              const updatedMemory = await persistMemorySafely(auth.user.$id, content, initialMemory);

              controller.enqueue(
                sseEvent("done", {
                  reply,
                  conversationId,
                  conversation: updatedConversation,
                  memory: updatedMemory,
                  userMessage: savedUserMessage,
                  assistantMessage: savedAssistantMessage,
                  source_confidence: backendMetadata.source_confidence,
                  used_web_search: backendMetadata.used_web_search,
                  sources: backendMetadata.sources,
                }),
              );
            } catch (error) {
              try {
                const fallbackResponse = await fetch(`${BACKEND_URL}/chat`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    messages: modelMessages,
                    max_new_tokens: maxNewTokens,
                    temperature: modelTemperature,
                    top_p: DEFAULT_TOP_P,
                  }),
                  cache: "no-store",
                });

                if (!fallbackResponse.ok) {
                  throw new Error(await fallbackResponse.text());
                }

                const fallbackData = await fallbackResponse.json();
                const fallbackReply = await formatAssistantReply(fallbackData.reply, content);
                const savedAssistantMessage = await saveMessage({
                  userId: auth.user.$id,
                  conversationId,
                  role: "assistant",
                  content: fallbackReply,
                });

                const resolvedTitle = needsGeneratedTitle
                  ? await generateConversationTitle(content, fallbackReply, backendConfig.system_prompt)
                  : conversationData.conversation.title;

                const updatedConversation = await updateConversationSummary(conversationId, auth.user.$id, {
                  title: resolvedTitle,
                  lastMessagePreview: fallbackReply.slice(0, 120),
                });

                const updatedMemory = await persistMemorySafely(auth.user.$id, content, initialMemory);

                controller.enqueue(
                  sseEvent("done", {
                    reply: fallbackReply,
                    conversationId,
                    conversation: updatedConversation,
                    memory: updatedMemory,
                    userMessage: savedUserMessage,
                    assistantMessage: savedAssistantMessage,
                    source_confidence:
                      fallbackData.source_confidence || backendMetadata.source_confidence || "none",
                    used_web_search:
                      fallbackData.used_web_search || backendMetadata.used_web_search || false,
                    sources: Array.isArray(fallbackData.sources)
                      ? fallbackData.sources
                      : backendMetadata.sources,
                  }),
                );
              } catch (fallbackError) {
                controller.enqueue(
                  sseEvent("error", {
                    error:
                      fallbackError?.message ||
                      error?.message ||
                      "Streaming failed.",
                    conversationId,
                  }),
                );
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      } catch {
        // Fall back to the regular chat endpoint if remote SSE is flaky.
      }
    }

    const backendResponse = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: modelMessages,
        max_new_tokens: maxNewTokens,
        temperature: modelTemperature,
        top_p: DEFAULT_TOP_P,
      }),
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const failureText = await backendResponse.text();
      return Response.json(
        { error: failureText || `Chat request failed (${backendResponse.status}).`, conversationId },
        { status: backendResponse.status },
      );
    }

    const backendData = await backendResponse.json();
    const reply = await formatAssistantReply(backendData.reply, content);
    const sourceConfidence = backendData.source_confidence || "none";
    const usedWebSearch = backendData.used_web_search || false;
    const sources = backendData.sources || [];

    const savedAssistantMessage = await saveMessage({
      userId: auth.user.$id,
      conversationId,
      role: "assistant",
      content: reply,
    });

    const resolvedTitle = needsGeneratedTitle
      ? await generateConversationTitle(content, reply, backendConfig.system_prompt)
      : conversationData.conversation.title;

    const updatedConversation = await updateConversationSummary(conversationId, auth.user.$id, {
      title: resolvedTitle,
      lastMessagePreview: reply.slice(0, 120),
    });
    const updatedMemory = await persistMemorySafely(auth.user.$id, content, initialMemory);

    return Response.json({
      reply,
      conversationId,
      conversation: updatedConversation,
      memory: updatedMemory,
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage,
      source_confidence: sourceConfidence,
      used_web_search: usedWebSearch,
      sources,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to send chat message.", conversationId },
      { status: 500 },
    );
  }
}
