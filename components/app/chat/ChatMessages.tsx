// @ts-nocheck
"use client";

import { Fragment, useMemo, useState } from "react";
import { NexaMark } from "./ChatIcons";
import createIcon from "../../../assets/ionicons/src/svg/create-outline.svg";
import downloadIcon from "../../../assets/ionicons/src/svg/download-outline.svg";
import resizeIcon from "../../../assets/ionicons/src/svg/resize-outline.svg";

const STRUCTURED_SECTION_LABELS = [
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

function ThinkingDots({ tone = "thinking" }) {
  const accentClass =
    tone === "searching"
      ? "bg-[#2d7dd2]"
      : tone === "typing"
        ? "bg-[#2aa876]"
        : tone === "creating-image"
          ? "bg-[#3ac4ff]"
          : "bg-chat-muted";

  return (
    <div className="flex items-center gap-1 py-2">
      <span className={`h-2 w-2 animate-bounce rounded-full ${accentClass} [animation-delay:-0.3s]`} />
      <span className={`h-2 w-2 animate-bounce rounded-full ${accentClass} [animation-delay:-0.15s]`} />
      <span className={`h-2 w-2 animate-bounce rounded-full ${accentClass}`} />
    </div>
  );
}

function IconAsset({ icon, alt, className = "h-4 w-4" }) {
  const src = typeof icon === "string" ? icon : icon?.src;
  if (!src) {
    return null;
  }

  return <img src={src} alt={alt} className={`${className} invert`} draggable={false} />;
}

function ImageGenerationPendingCard({ status }) {
  const title = status?.title || "Thinking";
  const detail =
    status?.detail ||
    "Nexa is planning the image design, detail, style, and aspect ratio before rendering.";
  const chips = [
    status?.aspectRatio,
    status?.style,
    status?.status ? String(status.status).replace(/-/g, " ") : null,
  ].filter(Boolean);

  return (
    <div className="w-full max-w-[480px] space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold leading-6 text-ink">
          {title}
          {title !== "Thinking" ? <span className="ml-1 text-chat-muted">&gt;</span> : null}
        </p>
        <p className="max-w-[44rem] text-[15px] leading-7 text-ink/90">{detail}</p>
        {chips.length ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-chat-border bg-black/[0.03] px-2.5 py-1 text-[11px] font-medium capitalize text-chat-muted"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-chat-border bg-[#2d2d30] shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.28) 1.4px, transparent 1.6px)",
            backgroundSize: "27px 27px",
            backgroundPosition: "center",
            animation: "nexaImageGridDrift 4.5s linear infinite",
          }}
        />
        <div
          className="absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm"
          style={{ animation: "nexaImageSweep 2.8s ease-in-out infinite" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-cyan-300/10 blur-xl"
          style={{ animation: "nexaImagePulse 2.2s ease-in-out infinite" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/18 to-transparent" />
        <div className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-white/85">
          {status?.progress ? `${Math.min(99, Math.max(1, Math.round(status.progress)))}%` : "Generating"}
        </div>
        <div className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30">
          <ThinkingDots tone="creating-image" />
        </div>
        <style jsx>{`
          @keyframes nexaImageGridDrift {
            0% {
              background-position: 0 0;
              opacity: 0.46;
            }
            50% {
              opacity: 0.72;
            }
            100% {
              background-position: 27px 27px;
              opacity: 0.46;
            }
          }

          @keyframes nexaImageSweep {
            0% {
              transform: translateX(0);
              opacity: 0;
            }
            18% {
              opacity: 1;
            }
            70% {
              opacity: 0.7;
            }
            100% {
              transform: translateX(310%);
              opacity: 0;
            }
          }

          @keyframes nexaImagePulse {
            0%,
            100% {
              opacity: 0.16;
              transform: translate(-50%, -50%) scale(0.82);
            }
            50% {
              opacity: 0.42;
              transform: translate(-50%, -50%) scale(1.18);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function normalizeRenderableText(text) {
  let normalized = String(text || "");

  const boldMarkerCount = (normalized.match(/\*\*/g) || []).length;
  if (boldMarkerCount % 2 === 1) {
    normalized = normalized.replace(/\*\*/g, "");
  }

  const backtickCount = (normalized.match(/`/g) || []).length;
  if (backtickCount % 2 === 1) {
    normalized = normalized.replace(/`/g, "");
  }

  return normalized;
}

function normalizeStructuredSections(text) {
  let normalized = String(text || "");

  const labels = [
    "Latest Update",
    "Key Points",
    "What Changed",
    "Why It Matters",
    "Summary",
  ];

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(
      new RegExp(`\\*\\*${escaped}\\*\\*\\s+`, "g"),
      `**${label}**\n\n`,
    );
    normalized = normalized.replace(
      new RegExp(`(^|\\n)${escaped}:?\\s+`, "g"),
      `$1**${label}**\n\n`,
    );
  }

  normalized = normalized.replace(/\s+(#{1,6}\s+)/g, "\n\n$1");

  for (const label of STRUCTURED_SECTION_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(
      new RegExp(`(^|\\n)(?:#{1,6}\\s*)?${escaped}\\s*[-:]\\s+`, "gi"),
      `$1## ${label}\n- `,
    );
  }

  normalized = normalized
    .replace(/([^\n])\n(##|###)\s/g, "$1\n\n$2 ")
    .replace(/^\s*([A-Za-z][A-Za-z/&()\- ]{2,60})\s*\|\s*(.+?)\s*\|?\s*$/gm, (_, title, body) => {
      const cleanedTitle = String(title).trim();
      const cleanedBody = String(body)
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
        .join("\n- ");
      return `### ${cleanedTitle}\n- ${cleanedBody}`;
    })
    .replace(/^([*_]{1,2})([^*_].{1,80}?)\1$/gm, "### $2")
    .replace(/^\s*-\s*$/gm, "");

  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  return normalized;
}

function renderInline(text) {
  const source = normalizeRenderableText(text);
  const nodes = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={`code-${match.index}`}
          className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[0.92em] text-ink"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes.length ? nodes : source;
}

function renderParagraphLines(text) {
  return text.split("\n").map((line, index, lines) => {
    const backendOnly = /^\s*Backend:\s*[\w.-]+\s*$/i.test(line);

    if (backendOnly) {
      return null;
    }

    return (
      <Fragment key={`line-${index}`}>
        {renderInline(line)}
        {index < lines.length - 1 ? <br /> : null}
      </Fragment>
    );
  });
}

function renderMarkdownImage(line, key) {
  const match = String(line || "").trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) {
    return null;
  }

  const alt = match[1]?.trim() || "Generated image";
  const src = match[2]?.trim();
  if (!src) {
    return null;
  }

  return (
    <figure
      key={key}
      className="group relative aspect-square w-full max-w-[480px] overflow-hidden rounded-[1.5rem] bg-[#202123] shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent opacity-80" />
      <button
        type="button"
        aria-label="Preview generated image"
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-sm text-white/90 opacity-90 ring-1 ring-white/15 transition hover:bg-black/50"
      >
        <IconAsset icon={resizeIcon} alt="" />
      </button>
      <button
        type="button"
        className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/10 transition hover:bg-black/60"
      >
        <IconAsset icon={createIcon} alt="" className="h-3.5 w-3.5" />
        Edit
      </button>
      <a
        href={src}
        download
        aria-label="Download generated image"
        className="absolute bottom-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg leading-none text-white/90 ring-1 ring-white/10 transition hover:bg-black/60"
      >
        <IconAsset icon={downloadIcon} alt="" />
      </a>
    </figure>
  );
}

function cleanGeneratedImageText(value) {
  return String(value || "")
    .replace(/^\s*Generated image:\s*[\s\S]*$/i, "")
    .replace(/\s*Backend:\s*[\w.-]+\s*/gi, " ")
    .trim();
}

function renderParagraphWithImages(paragraph, keyPrefix) {
  const source = String(paragraph || "");
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const nodes = [];
  let lastIndex = 0;
  let imageIndex = 0;
  let match;

  while ((match = imagePattern.exec(source)) !== null) {
    const before = cleanGeneratedImageText(source.slice(lastIndex, match.index));
    if (before) {
      nodes.push(
        <p
          key={`${keyPrefix}-text-${imageIndex}`}
          className="whitespace-pre-wrap break-words text-[15px] leading-7 text-ink [overflow-wrap:anywhere]"
        >
          {renderParagraphLines(before)}
        </p>,
      );
    }

    const image = renderMarkdownImage(match[0], `${keyPrefix}-image-${imageIndex}`);
    if (image) {
      nodes.push(image);
    }

    lastIndex = match.index + match[0].length;
    imageIndex += 1;
  }

  const after = cleanGeneratedImageText(source.slice(lastIndex));
  if (after) {
    nodes.push(
      <p
        key={`${keyPrefix}-text-after`}
        className="whitespace-pre-wrap break-words text-[15px] leading-7 text-ink [overflow-wrap:anywhere]"
      >
        {renderParagraphLines(after)}
      </p>,
    );
  }

  if (!nodes.length) {
    return null;
  }

  return (
    <section key={keyPrefix} className="space-y-3">
      {nodes}
    </section>
  );
}

function isMarkdownTable(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    return false;
  }

  const trimmed = lines.map((line) => line.trim()).filter(Boolean);
  if (trimmed.length < 2) {
    return false;
  }

  const separator = trimmed[1];
  if (!separator.includes("|")) {
    return false;
  }

  const normalizedSeparator = separator.replace(/\|/g, "").trim();
  if (!/^:?-{3,}:?(?:\s+:?-{3,}:?)*$/.test(normalizedSeparator.replace(/\s+/g, " "))) {
    return false;
  }

  return trimmed.every((line) => line.includes("|"));
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderMarkdownTable(lines, key) {
  const trimmed = lines.map((line) => line.trim()).filter(Boolean);
  const headers = splitMarkdownRow(trimmed[0]);
  const rows = trimmed.slice(2).map(splitMarkdownRow);

  return (
    <div key={key} className="overflow-x-auto">
      <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-chat-border bg-white/[0.02] text-left text-[15px] leading-7 text-ink">
        <thead className="bg-black/[0.04]">
          <tr>
            {headers.map((header, index) => (
              <th
                key={`header-${key}-${index}`}
                className="border-b border-chat-border px-4 py-3 font-semibold"
              >
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${key}-${rowIndex}`} className="align-top">
              {headers.map((_, cellIndex) => (
                <td
                  key={`cell-${key}-${rowIndex}-${cellIndex}`}
                  className="border-t border-chat-border px-4 py-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                >
                  {renderInline(row[cellIndex] || "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildStreamingPreview(content) {
  return String(content || "")
    .replace(/```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderStreamingContent(content) {
  const preview = normalizeStructuredSections(buildStreamingPreview(content));
  const safeContent = normalizeRenderableText(preview);
  if (!safeContent) {
    return null;
  }

  return <div className="space-y-4">{renderAssistantContent(safeContent, { enableTables: false })}</div>;
}

function renderAssistantContent(content, options = {}) {
  const { enableTables = true } = options;
  const raw = normalizeStructuredSections(String(content || ""))
    .replace(/\s+(?=!\[[^\]]*\]\([^)]+\))/g, "\n\n")
    .replace(/(\!\[[^\]]*\]\([^)]+\))\s+(Backend:\s*[\w.-]+)/gi, "$1\n\n$2")
    .trim();
  if (!raw) {
    return null;
  }

  const blocks = raw
    .split(/```/)
    .map((block, index) => ({ block: block.trim(), code: index % 2 === 1 }))
    .filter((item) => item.block);

  return blocks.flatMap(({ block, code }, index) => {
    if (code) {
      const codeLines = block.split("\n");
      const language = /^[a-z0-9+#.-]+$/i.test(codeLines[0]?.trim() || "")
        ? codeLines[0].trim()
        : "";
      const codeBody = language ? codeLines.slice(1).join("\n") : block;

      return (
        <section key={`code-${index}`} className="space-y-2">
          {language ? (
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-chat-muted">
              {language}
            </div>
          ) : null}
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-chat-border bg-black/[0.04] p-4 text-[14px] leading-6 text-ink">
            <code className="font-mono break-words">{codeBody}</code>
          </pre>
        </section>
      );
    }

    const paragraphs = block
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return paragraphs.map((paragraph, paragraphIndex) => {
      const lines = paragraph.split("\n").map((line) => line.trimEnd());
      const firstLine = lines[0].trim();
      const dividerOnly = lines.length === 1 && /^([-*_]\s*){3,}$/.test(firstLine);
      const backendOnly = lines.length === 1 && /^\s*Backend:\s*[\w.-]+\s*$/i.test(firstLine);
      const generatedImageTextOnly = lines.length === 1 && /^\s*Generated image:\s*/i.test(firstLine);
      const imageOnly = lines.length === 1 ? renderMarkdownImage(firstLine, `image-${index}-${paragraphIndex}`) : null;

      if (backendOnly || generatedImageTextOnly) {
        return null;
      }

      if (imageOnly) {
        return imageOnly;
      }

      if (dividerOnly) {
        return (
          <hr
            key={`divider-${index}-${paragraphIndex}`}
            className="my-1 border-0 border-t border-chat-border/80"
          />
        );
      }

      if (paragraph.includes("![")) {
        const imageParagraph = renderParagraphWithImages(
          paragraph,
          `mixed-image-${index}-${paragraphIndex}`,
        );
        if (imageParagraph) {
          return imageParagraph;
        }
      }

      if (enableTables && isMarkdownTable(lines)) {
        return renderMarkdownTable(lines, `table-${index}-${paragraphIndex}`);
      }

      const headingMatch = firstLine.match(/^(#{1,3}\s+)(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].trim().length;
        const heading = headingMatch[2].trim();
        const rest = lines.slice(1).join("\n").trim();
        const headingClass =
          level === 1
            ? "text-[1.1rem] font-semibold leading-8 text-ink"
            : level === 2
              ? "text-[1rem] font-semibold leading-7 text-ink"
              : "text-[0.96rem] font-semibold leading-7 text-ink";

        return (
          <section key={`heading-${index}-${paragraphIndex}`} className="space-y-2">
            <h3 className={headingClass}>{renderInline(heading)}</h3>
            {rest ? (
              <div className="space-y-3">{renderAssistantContent(rest, options)}</div>
            ) : null}
          </section>
        );
      }

      const numberedSectionMatch = firstLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedSectionMatch && lines.length > 1) {
        const sectionNumber = numberedSectionMatch[1];
        const heading = numberedSectionMatch[2].trim();
        const rest = lines.slice(1).join("\n").trim();

        return (
          <section key={`numbered-${index}-${paragraphIndex}`} className="space-y-3 pt-1">
            <h2 className="text-[1.12rem] font-semibold leading-8 text-ink">
              <span className="mr-2">{sectionNumber}.</span>
              <span>{renderInline(heading)}</span>
            </h2>
            {rest ? <div className="space-y-3">{renderAssistantContent(rest, options)}</div> : null}
          </section>
        );
      }

      const colonHeadingMatch = firstLine.match(/^([A-Za-z0-9][^:]{1,80}):\s*$/);
      if (colonHeadingMatch && lines.length > 1) {
        const heading = colonHeadingMatch[1].trim();
        const rest = lines.slice(1).join("\n").trim();
        return (
          <section key={`label-${index}-${paragraphIndex}`} className="space-y-2">
            <h3 className="text-[15px] font-semibold leading-7 text-ink">{renderInline(heading)}</h3>
            <div className="space-y-3">{renderAssistantContent(rest, options)}</div>
          </section>
        );
      }

      const structuredHeadingMatch = firstLine.match(
        new RegExp(
          `^(${STRUCTURED_SECTION_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*[-:]\\s+(.+)$`,
          "i",
        ),
      );
      if (structuredHeadingMatch) {
        const heading = structuredHeadingMatch[1].trim();
        const rest = structuredHeadingMatch[2].trim();
        return (
          <section key={`structured-${index}-${paragraphIndex}`} className="space-y-2">
            <h3 className="text-[1rem] font-semibold leading-7 text-ink">{renderInline(heading)}</h3>
            <ul className="list-disc space-y-2 pl-6 text-[15px] leading-7 text-ink break-words [overflow-wrap:anywhere]">
              <li>{renderInline(rest)}</li>
            </ul>
          </section>
        );
      }

      const standaloneTitle =
        lines.length === 1 &&
        /^[A-Za-z][A-Za-z0-9/&()\-+,. ]{1,80}$/.test(firstLine) &&
        !/[.:;!?]$/.test(firstLine) &&
        !/^([-*]|\d+\.)\s+/.test(firstLine);
      if (standaloneTitle) {
        return (
          <h4
            key={`standalone-${index}-${paragraphIndex}`}
            className="pt-1 text-[1rem] font-semibold leading-7 text-ink"
          >
            {renderInline(firstLine)}
          </h4>
        );
      }

      const bulletLines = lines.filter((line) => /^([-*]|\d+\.)\s+/.test(line.trim()));
      if (bulletLines.length === lines.length) {
        const ordered = lines.every((line) => /^\d+\.\s+/.test(line.trim()));
        const ListTag = ordered ? "ol" : "ul";
        const listClass = ordered ? "list-decimal" : "list-disc";
        return (
          <ListTag
            key={`list-${index}-${paragraphIndex}`}
            className={`space-y-2 pl-6 text-[15px] leading-7 text-ink break-words [overflow-wrap:anywhere] ${listClass}`}
          >
            {lines.map((line, itemIndex) => (
              <li key={`item-${index}-${paragraphIndex}-${itemIndex}`}>
                {renderInline(line.replace(/^([-*]|\d+\.)\s+/, ""))}
              </li>
            ))}
          </ListTag>
        );
      }

      return (
        <p
          key={`paragraph-${index}-${paragraphIndex}`}
          className="whitespace-pre-wrap break-words text-[15px] leading-7 text-ink [overflow-wrap:anywhere]"
        >
          {renderParagraphLines(paragraph)}
        </p>
      );
    });
  });
}

function normalizeSources(sources, fallbackConfidence) {
  if (!Array.isArray(sources)) {
    return [];
  }

  return sources
    .filter((source) => source && source.url)
    .map((source) => {
      let domain = source.domain;
      if (!domain) {
        try {
          domain = new URL(source.url).hostname.replace(/^www\./, "");
        } catch {
          domain = "";
        }
      }

      return {
        title: source.title || source.url,
        url: source.url,
        domain,
        snippet: source.snippet || "",
        confidence: source.confidence || fallbackConfidence || "medium",
      };
    });
}

function confidenceBadgeClass(confidence) {
  if (confidence === "high") {
    return "bg-green-100/60 text-green-700";
  }
  if (confidence === "medium") {
    return "bg-yellow-100/60 text-yellow-700";
  }
  if (confidence === "low") {
    return "bg-orange-100/60 text-orange-700";
  }
  return "bg-gray-100/60 text-gray-700";
}

export default function ChatMessages({
  messages,
  assistantName,
  isSending,
  sendingActivity,
  imageGenerationStatus,
  conversationLoading,
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeSources, setActiveSources] = useState([]);

  const activityLabel =
    sendingActivity === "searching"
      ? "Searching the web"
      : sendingActivity === "creating-image"
        ? "Creating image"
      : sendingActivity === "thinking"
        ? "Thinking"
      : sendingActivity === "typing"
        ? "Drafting reply"
        : assistantName;

  const activityHint =
    sendingActivity === "searching"
      ? "Nexa is gathering fresh sources"
      : sendingActivity === "creating-image"
        ? "Nexa is generating the image"
      : sendingActivity === "thinking"
        ? "Nexa is planning the response"
      : sendingActivity === "typing"
        ? "Nexa is writing the answer"
        : "";

  const activeSourceCount = useMemo(() => activeSources.length, [activeSources]);

  return (
    <div className="relative mx-auto flex w-full max-w-6xl gap-8">
      <div className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {conversationLoading ? (
            <p className="py-8 text-center text-sm text-chat-muted">Loading conversation...</p>
          ) : null}

          {messages.map((message, index) => (
            (() => {
              const isStreamingAssistant =
                isSending &&
                message.role === "assistant" &&
                index === messages.length - 1;
              const sources = normalizeSources(message.sources, message.sourceConfidence);
              const hasSources = sources.length > 0;

              return (
                <article
                  key={message.id || `${message.role}-${index}`}
                  className={[
                    "group w-full",
                    message.role === "user" ? "flex justify-end" : "flex gap-4",
                  ].join(" ")}
                >
                  {message.role === "assistant" ? (
                    <div className="mt-0.5 shrink-0">
                      <NexaMark className="h-7 w-7 text-xs" />
                    </div>
                  ) : null}

                  <div className={message.role === "user" ? "max-w-[85%]" : "min-w-0 flex-1 pt-0.5"}>
                    {message.role === "user" ? (
                      <div className="rounded-[1.25rem] bg-chat-user px-4 py-2.5 text-[15px] leading-7 text-ink whitespace-pre-wrap">
                        {message.content}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isStreamingAssistant
                          ? renderStreamingContent(message.content)
                          : renderAssistantContent(message.content)}
                        {(message.usedWebSearch || hasSources) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-chat-muted">Web search used</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceBadgeClass(message.sourceConfidence)}`}>
                              {message.sourceConfidence === "high"
                                ? "High confidence"
                                : message.sourceConfidence === "medium"
                                  ? "Medium confidence"
                                  : message.sourceConfidence === "low"
                                    ? "Low confidence"
                                    : "Unrated"}
                            </span>
                            {hasSources ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSources(sources);
                                  setSourcesOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-chat-border bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-black/[0.05]"
                              >
                                Sources
                                <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px]">
                                  {sources.length}
                                </span>
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })()
          ))}

          {isSending ? (
            <article className="flex gap-4">
              <NexaMark className="h-7 w-7 shrink-0 text-xs" />
              {sendingActivity === "creating-image" ? (
                <ImageGenerationPendingCard status={imageGenerationStatus} />
              ) : (
                <div>
                  <p className="mb-1 text-xs font-medium text-chat-muted">{activityLabel}</p>
                  {activityHint ? (
                    <p className="text-[11px] text-chat-muted/80">{activityHint}</p>
                  ) : null}
                  <ThinkingDots tone={sendingActivity || "thinking"} />
                </div>
              )}
            </article>
          ) : null}
        </div>
      </div>

      {sourcesOpen ? (
        <aside className="sticky top-6 hidden h-[calc(100vh-4rem)] w-[360px] shrink-0 overflow-y-auto rounded-[1.5rem] border border-chat-border bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] xl:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Sources</h2>
              <p className="text-xs text-chat-muted">{activeSourceCount} attached to this answer</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSourcesOpen(false);
                setActiveSources([]);
              }}
              className="rounded-full border border-chat-border px-3 py-1 text-sm text-chat-muted transition hover:bg-black/[0.04]"
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            {activeSources.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-chat-border bg-black/[0.02] p-4 transition hover:bg-black/[0.04]"
              >
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-chat-muted">
                  {source.domain || "Source"}
                </div>
                <h3 className="mb-2 text-sm font-semibold leading-6 text-ink">{source.title}</h3>
                {source.snippet ? (
                  <p className="text-sm leading-6 text-chat-muted">{source.snippet}</p>
                ) : null}
                <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${confidenceBadgeClass(source.confidence)}`}>
                  {source.confidence || "medium"} confidence
                </span>
              </a>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
