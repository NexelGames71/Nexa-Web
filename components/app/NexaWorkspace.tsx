// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  account,
  appwriteConfigured,
  createSessionJwt,
  isAdminEmail,
} from "../../lib/appwrite";
import thinkingIcon from "../../assets/thinking.png";
import settingsIcon from "../../assets/settings.png";
import closeIcon from "../../assets/close.png";
import databaseIcon from "../../assets/database.png";
import ChatComposer from "./chat/ChatComposer";
import ChatEmptyState from "./chat/ChatEmptyState";
import ChatMessages from "./chat/ChatMessages";
import ChatTopBar from "./chat/ChatTopBar";
import nextIcon from "../../assets/next.png";
import ChatConversationItem from "./chat/ChatConversationItem";
import ChatArchivedDropdown from "./chat/ChatArchivedDropdown";
import { IconNewChat, IconSearch, IconSidebar, NexaMark } from "./chat/ChatIcons";
import PayPalSubscribeButton from "../billing/PayPalSubscribeButton";
import { notifyAuthChanged, useAuth } from "../providers/AuthProvider";
import { isChatPinned, sortWithPinnedFirst, togglePinnedChat } from "../../lib/pinned-chats";
import { NEXA_PLUS_PLAN } from "../../lib/billing-plans";
import { RESPONSE_LENGTH_OPTIONS, THINKING_MODES } from "../../lib/thinking-modes";

const QUICK_ACTIONS = ["Create an image", "Write or edit", "Look something up"];
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
];

const MOJIBAKE_REPLACEMENTS = [
  [/Ã¢â‚¬â€/g, "â€”"],
  [/Ã¢â‚¬â€œ/g, "â€“"],
  [/Ã¢â‚¬Ëœ/g, "â€˜"],
  [/Ã¢â‚¬â„¢/g, "â€™"],
  [/Ã¢â‚¬Å“/g, "â€œ"],
  [/Ã¢â‚¬Â/g, "â€"],
  [/Ã¢â‚¬Â¦/g, "â€¦"],
  [/Ã¢â‚¬Â¢/g, "â€¢"],
  [/Ã¢Å“â€¦/g, ""],
  [/Ã¢Å“â€Ã¯Â¸Â/g, ""],
  [/Ã¢Å“â€¦/g, ""],
  [/Ã¢Å“Â³Ã¯Â¸Â/g, ""],
  [/Ã¢Å¡Â Ã¯Â¸Â/g, ""],
  [/Ã¢ÂÅ’/g, ""],
  [/Ã¢Ââ€œ/g, ""],
  [/Ã¢Ââ€”/g, ""],
  [/Ã¢ÂÂ±Ã¯Â¸Â/g, ""],
  [/Ã°Å¸â€Â¥/g, ""],
  [/Ã°Å¸â€Â/g, ""],
  [/Ã°Å¸â€Â§/g, ""],
  [/Ã°Å¸â€™Â¡/g, ""],
  [/Ã°Å¸â€˜â€°/g, ""],
  [/Ã°Å¸Å¡â‚¬/g, ""],
  [/Ã°Å¸Å¸Â¢/g, ""],
  [/Ã°Å¸Å¸Â¡/g, ""],
  [/Ã°Å¸Å¸Â¥/g, ""],
  [/Ã°Å¸â€Â/g, ""],
  [/Ã°Å¸â€Â¹/g, ""],
  [/Ã°Å¸â€Â¸/g, ""],
  [/Ã°Å¸â€â€™/g, ""],
  [/Ã°Å¸â€œâ€š/g, ""],
  [/Ã°Å¸Å½Â¯/g, ""],
  [/Ã°Å¸Å¡Â©/g, ""],
  [/Ã°Å¸â€˜Â¥/g, ""],
  [/Ã°Å¸â€™Â°/g, ""],
];

function repairMojibake(value) {
  let text = String(value || "");
  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/\uFFFD/g, "")
    .replace(/[â”‚â•­â•®â•¯â•°â”€â”Œâ”â””â”˜â”œâ”¤â”¬â”´â”¼]/g, "")
    .replace(/\r\n/g, "\n");
}

function stripUnexpectedInlineCjk(value) {
  return String(value || "")
    .replace(/(?<=[A-Za-z0-9.,!?;:'"()\]\s])[\u3400-\u9FFF]+(?=[A-Za-z0-9.,!?;:'"()[\]\s])/g, "")
    .replace(/\s{2,}/g, " ");
}

function sanitizeAssistantContent(value) {
  return stripUnexpectedInlineCjk(repairMojibake(value))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildImageGenerationErrorMessage(error) {
  const message = error?.message || "Image generation failed.";
  return `Image generation failed: ${message}`;
}

function sanitizeAssistantStreamChunk(value) {
  return stripUnexpectedInlineCjk(repairMojibake(value)).replace(/\r\n/g, "\n");
}

function sanitizeMessageContent(role, value) {
  if (role === "assistant") {
    return sanitizeAssistantContent(value);
  }
  return repairMojibake(value);
}

function isStructuredAssistantMessage(content) {
  const text = content.trim();
  if (!text) {
    return false;
  }

  return (
    text.includes("```") ||
    /\n\|.+\|/.test(text) ||
    /\n\s{2,}\S/.test(text)
  );
}

function shouldUseWideUserBubble(content) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length < 17;
}

function createEmptyMemoryDraft() {
  return {
    displayName: "",
    preferredTone: "",
    interestsText: "",
    customInstructions: "",
    facts: [],
    newFact: "",
  };
}

function draftFromMemory(memory) {
  return {
    displayName: memory?.displayName || "",
    preferredTone: memory?.preferredTone || "",
    interestsText: (memory?.interests || []).join(", "),
    customInstructions: memory?.customInstructions || "",
    facts: Array.isArray(memory?.facts) ? [...memory.facts] : [],
    newFact: "",
  };
}

function normalizeConversation(document) {
  const archivedValue = document?.archived;
  const archived =
    typeof archivedValue === "boolean"
      ? archivedValue
      : String(archivedValue ?? "").toLowerCase() === "true";

  return {
    id: document.$id || document.id || document.conversationId,
    title: document.title || "New chat",
    updatedAt: document.updatedAt || document.$updatedAt || "",
    lastMessagePreview: document.lastMessagePreview || "",
    archived,
    archivedAt: document.archivedAt || "",
  };
}

function normalizeMessage(document) {
  return {
    id: document.$id || document.id,
    role: document.role,
    content: sanitizeMessageContent(document.role, document.content),
    createdAt: document.createdAt || document.$createdAt || "",
    usedWebSearch: Boolean(document.usedWebSearch || document.used_web_search),
    sourceConfidence: document.sourceConfidence || document.source_confidence || "none",
    sources: Array.isArray(document.sources) ? document.sources : [],
  };
}

function parseSseEvents(buffer) {
  const events = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() || "";

  for (const part of parts) {
    const lines = part.split("\n");
    let event = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      }
    }

    if (data) {
      try {
        events.push({ event, data: JSON.parse(data) });
      } catch {}
    }
  }

  return { events, remainder };
}

function splitAssistantTypingChunks(content) {
  const normalized = String(content || "").replace(/\r\n/g, "\n");
  return normalized.match(/[^\s]+(?:\s+)?|\n/g) || [];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldLikelySearchWeb(content) {
  const normalized = String(content || "").toLowerCase();
  return WEB_SEARCH_HINT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isLikelyImageGenerationPrompt(content) {
  const normalized = String(content || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return false;
  }

  const explicitImageIntent =
    /\b(create|generate|draw|paint|render|design|make|illustrate|visualize|visualise)\b.{0,90}\b(image|picture|photo|illustration|artwork|logo|poster|wallpaper|avatar|icon|sticker|scene)\b/.test(normalized) ||
    /\b(image|picture|photo|illustration|artwork|logo|poster|wallpaper|avatar|icon|sticker)\b.{0,60}\b(of|for|showing|featuring|with)\b/.test(normalized) ||
    /\b(3d|premium|modern|futuristic|minimalist|photorealistic|cartoon|anime)\b.{0,80}\b(logo|icon|avatar|poster|wallpaper|scene|image)\b/.test(normalized) ||
    /\b(logo|icon|avatar|poster|wallpaper|scene|image)\b.{0,80}\b(featuring|with|centered|glowing|metallic|glass|studio lighting|composition)\b/.test(normalized);

  if (explicitImageIntent) {
    return true;
  }

  if (!/^(create|generate|draw|paint|render|design|make|illustrate)\b/.test(normalized)) {
    return false;
  }

  const visualSubject =
    /\b(puppy|dog|cat|kitten|animal|character|mascot|person|portrait|landscape|city|room|house|car|robot|dragon|product|object|scene|concept|cute|realistic|cartoon|anime|3d|orange|grey|gray|blue|red|green|purple|browser|globe|letter)\b/.test(normalized);
  const nonImageArtifact =
    /\b(app|application|website|code|function|script|plan|roadmap|strategy|essay|article|email|message|document|database|api|architecture|business|schedule|task|list)\b/.test(normalized);

  return visualSubject && !nonImageArtifact;
}

function ThinkingIndicator({ label }) {
  return (
    <article className="max-w-4xl px-1">
      <div className="mb-2 text-xs font-semibold text-muted">{label}</div>
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-2 shadow-soft">
        <span className="sr-only">{label} is thinking</span>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
      </div>
    </article>
  );
}

const SETTINGS_SECTIONS = [
  { id: "general", label: "General", icon: "o" },
  { id: "personalization", label: "Personalization", icon: "*" },
  { id: "memory", label: "Memory", icon: "@" },
  { id: "account", label: "Account", icon: "O" },
  { id: "billing", label: "Billing", icon: "$" },
  { id: "data-controls", label: "Data controls", icon: databaseIcon.src },
  { id: "notifications", label: "Notifications", icon: "!" },
  { id: "security", label: "Security", icon: "+" },
  { id: "keyboard", label: "Keyboard", icon: "=" },
];

const SETTINGS_SECTION_BY_ROUTE = {
  profile: "account",
  billing: "billing",
  security: "security",
  integrations: "general",
  memory: "memory",
  data: "data-controls",
};

export default function NexaWorkspace({
  routeMode = "chat",
  settingsSection = "",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const conversationPathname = routeMode === "settings" ? "/chat" : pathname || "/chat";
  const [assistantName, setAssistantName] = useState("Nexa");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [memorySaving, setMemorySaving] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState("");
  const [archivedMenuOpen, setArchivedMenuOpen] = useState(false);
  const [archivingConversationId, setArchivingConversationId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [responseLength, setResponseLength] = useState("auto");
  const [sendingActivity, setSendingActivity] = useState("");
  const [imageGenerationStatus, setImageGenerationStatus] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState("");
  const [activeSettingsSection, setActiveSettingsSection] = useState("general");
  const [dataControls, setDataControls] = useState({
    improveModelForEveryone: false,
    trainingOptInAt: "",
    trainingOptOutAt: "",
    counts: { active: 0, archived: 0 },
  });
  const [dataControlsSaving, setDataControlsSaving] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState("");
  const [memoryProfile, setMemoryProfile] = useState(null);
  const [memoryDraft, setMemoryDraft] = useState(createEmptyMemoryDraft());
  const [pinnedRevision, setPinnedRevision] = useState(0);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const typingRunRef = useRef(0);
  const { signOut: authSignOut } = useAuth();
  const isEmpty = messages.length === 0 && !activeConversationId;

  async function revealAssistantMessage(messageId, finalContent) {
    const runId = ++typingRunRef.current;
    const chunks = splitAssistantTypingChunks(finalContent);
    let built = "";

    for (let index = 0; index < chunks.length; index += 1) {
      if (typingRunRef.current !== runId) {
        return;
      }

      built += chunks[index];
      const nextContent = sanitizeAssistantContent(built);

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: nextContent,
              }
            : message,
        ),
      );

      const chunk = chunks[index];
      const delay =
        chunk === "\n" ? 12 : /[.!?]\s*$/.test(chunk) ? 45 : /[:;,-]\s*$/.test(chunk) ? 28 : 16;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const sortedConversations = useMemo(
    () => sortWithPinnedFirst(conversations),
    [conversations, pinnedRevision],
  );

  const sortedArchivedConversations = useMemo(
    () =>
      [...archivedConversations].sort(
        (left, right) =>
          new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime(),
      ),
    [archivedConversations],
  );

  const recentSearchItems = useMemo(
    () =>
      [...conversations, ...archivedConversations].map((conversation) => ({
        conversationId: conversation.id,
        title: conversation.title,
        snippet: conversation.lastMessagePreview,
        updatedAt: conversation.updatedAt,
        type: "conversation",
        archived: conversation.archived,
      })),
    [archivedConversations, conversations],
  );

  useEffect(() => {
    async function initialize() {
      if (!appwriteConfigured) {
        router.replace("/login");
        return;
      }

      try {
        const [user, jwt, configResponse] = await Promise.all([
          account.get(),
          createSessionJwt(),
          fetch("/api/ui-config"),
        ]);

        if (isAdminEmail(user.email)) {
          router.replace("/admin");
          return;
        }

        setCurrentUser(user);
        setAuthToken(jwt);
        notifyAuthChanged();

        if (configResponse.ok) {
          const config = await configResponse.json();
          setAssistantName(config.assistant_name || "Nexa");
        }

        setAuthLoading(false);

        try {
          const initialConversationId =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("chat") || ""
              : "";
          await loadWorkspace(jwt, initialConversationId);
        } catch (error) {
          setLoadError(error.message || "Failed to load workspace memory.");
        }
      } catch {
        router.replace("/login");
        return;
      } finally {
        setAuthLoading(false);
        setWorkspaceLoading(false);
      }
    }

    initialize();
  }, [router]);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const isSettingsRoute = routeMode === "settings";
    if (isSettingsRoute && currentUser && isAdminEmail(currentUser.email)) {
      router.replace("/admin");
      return;
    }
    setMemoryModalOpen(isSettingsRoute);
    if (isSettingsRoute) {
      const mapped =
        SETTINGS_SECTION_BY_ROUTE[settingsSection] || settingsSection || "general";
      setActiveSettingsSection(
        SETTINGS_SECTIONS.some((section) => section.id === mapped) ? mapped : "general",
      );
    } else {
      setActiveSettingsSection("general");
    }
  }, [currentUser, routeMode, router, settingsSection]);

  useEffect(() => {
    if (!addMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!event.target.closest("[data-add-menu-root], [data-composer-menu-root]")) {
        setAddMenuOpen("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setAddMenuOpen("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [addMenuOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults(recentSearchItems);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setSearchLoading(true);

      try {
        const response = await authorizedFetch(
          `/api/conversations?query=${encodeURIComponent(searchQuery.trim())}`,
        );
        const data = await response.json();

        if (!cancelled) {
          setSearchResults(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [searchOpen, searchQuery, recentSearchItems]);

  async function getValidAuthToken(forceRefresh = false) {
    if (!forceRefresh && authToken) {
      return authToken;
    }

    const jwt = await createSessionJwt();
    setAuthToken(jwt);
    return jwt;
  }

  async function authorizedFetch(path, options = {}, tokenOverride = "") {
    const jwt = tokenOverride || (await getValidAuthToken());
    if (!jwt) {
      throw new Error("Missing session token.");
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${jwt}`);

    let response = await fetch(path, {
      ...options,
      headers,
    });

    if (response.status === 401 && !tokenOverride) {
      const refreshedJwt = await getValidAuthToken(true);
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${refreshedJwt}`);

      response = await fetch(path, {
        ...options,
        headers: retryHeaders,
      });
    }

    return response;
  }

  async function loadDataControls(tokenOverride = "") {
    const response = await authorizedFetch("/api/data-controls", {}, tokenOverride);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load data controls.");
    }

    setDataControls({
      improveModelForEveryone: Boolean(data.preferences?.improveModelForEveryone),
      trainingOptInAt: String(data.preferences?.trainingOptInAt || ""),
      trainingOptOutAt: String(data.preferences?.trainingOptOutAt || ""),
      counts: {
        active: Number(data.counts?.active || 0),
        archived: Number(data.counts?.archived || 0),
      },
    });

    return data;
  }

  async function applyConversationLists(active = [], archived = []) {
    const items = Array.isArray(active) ? active.map(normalizeConversation) : [];
    const archivedItems = Array.isArray(archived)
      ? archived.map(normalizeConversation)
      : [];

    setConversations(items);
    setArchivedConversations(archivedItems);
    setSearchResults([...items, ...archivedItems]);
    setDataControls((current) => ({
      ...current,
      counts: { active: items.length, archived: archivedItems.length },
    }));

    return { items, archivedItems };
  }

  function sortByUpdatedAt(items) {
    return [...items].sort(
      (left, right) =>
        new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime(),
    );
  }

  function computeConversationMove(conversation, archived, activeList, archivedList) {
    const item = normalizeConversation(conversation);
    const nextActive = archived
      ? activeList.filter((entry) => entry.id !== item.id)
      : sortByUpdatedAt([item, ...activeList.filter((entry) => entry.id !== item.id)]);
    const nextArchived = archived
      ? sortByUpdatedAt([item, ...archivedList.filter((entry) => entry.id !== item.id)])
      : archivedList.filter((entry) => entry.id !== item.id);

    return { item, nextActive, nextArchived };
  }

  function applyLocalConversationMove(conversation, archived, activeList, archivedList) {
    const { nextActive, nextArchived } = computeConversationMove(
      conversation,
      archived,
      activeList ?? conversations,
      archivedList ?? archivedConversations,
    );

    setConversations(nextActive);
    setArchivedConversations(nextArchived);
    setSearchResults([...nextActive, ...nextArchived]);
    setDataControls((current) => ({
      ...current,
      counts: { active: nextActive.length, archived: nextArchived.length },
    }));

    return { activeItems: nextActive, archivedItems: nextArchived };
  }

  async function loadWorkspace(jwt, preferredConversationId = "") {
    const conversationResponse = await authorizedFetch("/api/conversations?split=true", {}, jwt);

    if (!conversationResponse.ok) {
      const conversationData = await conversationResponse.json().catch(() => ({}));
      throw new Error(conversationData.error || "Failed to load conversations.");
    }

    const conversationData = await conversationResponse.json();
    const { items, archivedItems } = await applyConversationLists(
      conversationData.active,
      conversationData.archived,
    );

    setWorkspaceLoading(false);

    void (async () => {
      try {
        const memoryResponse = await authorizedFetch("/api/memory", {}, jwt);
        const memoryData = await memoryResponse.json().catch(() => ({}));

        if (memoryResponse.ok) {
          setMemoryProfile(memoryData.memory || null);
          setMemoryDraft(draftFromMemory(memoryData.memory || null));
        }

        await loadDataControls(jwt);
      } catch {
        // Memory and data controls are non-blocking for the chat shell.
      }
    })();

    if (preferredConversationId) {
      const preferredConversation = items.find((item) => item.id === preferredConversationId);
      if (preferredConversation) {
        void openConversation(preferredConversation.id, jwt);
        return;
      }
      updateConversationUrl("");
    }

    setActiveConversationId("");
    setMessages([]);
  }

  async function refreshConversations(tokenOverride = "") {
    const response = await authorizedFetch("/api/conversations?split=true", {}, tokenOverride);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to refresh conversations.");
    }

    return applyConversationLists(data.active, data.archived);
  }

  async function openConversation(conversationId, tokenOverride = "") {
    if (!conversationId) {
      setActiveConversationId("");
      setMessages([]);
      updateConversationUrl("");
      return;
    }

    setConversationLoading(true);
    setLoadError("");

    try {
      const response = await authorizedFetch(
        `/api/conversations/${conversationId}`,
        {},
        tokenOverride,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversation.");
      }

      setActiveConversationId(conversationId);
      setMessages(Array.isArray(data.messages) ? data.messages.map(normalizeMessage) : []);
      updateConversationUrl(conversationId);
      setSearchOpen(false);
      setMobileSidebarOpen(false);
    } catch (error) {
      setLoadError(error.message || "Failed to load conversation.");
    } finally {
      setConversationLoading(false);
    }
  }

  function updateConversationUrl(conversationId = "") {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );

    if (conversationId) {
      params.set("chat", conversationId);
    } else {
      params.delete("chat");
    }

    const query = params.toString();
    router.replace(query ? `${conversationPathname}?${query}` : conversationPathname, {
      scroll: false,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || isSending) {
      return;
    }

    setPrompt("");
    setIsSending(true);
    const imageGenerationRequested = isLikelyImageGenerationPrompt(content);
    setSendingActivity(
      imageGenerationRequested
        ? "creating-image"
        : shouldLikelySearchWeb(content)
          ? "searching"
          : "thinking",
    );
    setImageGenerationStatus(
      imageGenerationRequested
        ? {
            title: "Thinking",
            detail: "Planning the image design, detail, style, and aspect ratio.",
            progress: 8,
            status: "thinking",
            aspectRatio: "1:1",
            style: "image design",
          }
        : null,
    );
    setLoadError("");

    const optimisticId = `user-${Date.now()}`;
    const streamingAssistantId = `assistant-stream-${Date.now()}`;
    setMessages((current) => [...current, { id: optimisticId, role: "user", content }]);

    try {
      const response = await authorizedFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          message: content,
          stream: true,
          ...(responseLength === "auto" ? {} : { max_new_tokens: Number(responseLength) }),
        }),
      });

      const contentType = response.headers.get("Content-Type") || "";

      if (!response.ok) {
        const data = contentType.includes("application/json")
          ? await response.json()
          : { error: await response.text() };
        throw new Error(data.error || "Request failed.");
      }

      if (!contentType.includes("text/event-stream") || !response.body) {
        const data = await response.json();
        const conversationId = data.conversationId || activeConversationId;
        setConversations((current) => {
          const updatedConversation = normalizeConversation(data.conversation);
          return [updatedConversation, ...current.filter((item) => item.id !== updatedConversation.id)];
        });
        setSearchResults((current) => {
          const updatedConversation = {
            conversationId: data.conversation.$id || data.conversation.conversationId,
            title: data.conversation.title || "New chat",
            snippet: data.conversation.lastMessagePreview || "",
            updatedAt: data.conversation.updatedAt || data.conversation.$updatedAt || "",
            type: "conversation",
          };
          return [
            updatedConversation,
            ...current.filter((item) => item.conversationId !== updatedConversation.conversationId),
          ];
        });
        setActiveConversationId(conversationId);
        updateConversationUrl(conversationId);

        if (data.memory) {
          setMemoryProfile(data.memory);
          setMemoryDraft(draftFromMemory(data.memory));
        }

        const savedUserMessage = data.userMessage ? normalizeMessage(data.userMessage) : null;
        if (data.imageJob?.id) {
          const imageJob = data.imageJob;
          const pollUrl = imageJob.pollUrl || `/api/image-jobs/${imageJob.id}`;
          const imageAssistantId = streamingAssistantId;

          setSendingActivity("creating-image");
          setImageGenerationStatus({
            title: imageJob.title || "Thinking",
            detail:
              imageJob.detail ||
              "Nexa is planning the image design, detail, style, and aspect ratio.",
            progress: Number(imageJob.progress || 8),
            status: imageJob.status || "queued",
            aspectRatio: imageJob.aspect_ratio || imageJob.aspectRatio || "1:1",
            style: imageJob.style || "image design",
          });

          setMessages((current) => {
            const withoutOptimistic = current.filter((message) => message.id !== optimisticId);
            return [
              ...withoutOptimistic,
              ...(savedUserMessage ? [savedUserMessage] : []),
            ];
          });

          const startedAt = Date.now();
          while (Date.now() - startedAt < 15 * 60 * 1000) {
            await wait(2000);
            const jobResponse = await authorizedFetch(pollUrl);
            const jobData = await jobResponse.json();

            if (!jobResponse.ok) {
              throw new Error(jobData.error || "Failed to check image generation status.");
            }

            const job = jobData.job || {};
            setImageGenerationStatus({
              title: job.title || "Designing image",
              detail:
                job.detail ||
                "Nexa is planning the image design, detail, style, and aspect ratio.",
              progress: Number(job.progress || 0),
              status: job.status || "processing",
              aspectRatio: job.aspect_ratio || job.aspectRatio || "1:1",
              style: job.style || "image design",
            });

            if (job.status === "failed") {
              throw new Error(job.error || "Image generation failed.");
            }

            if (job.status === "completed") {
              const result = job.result || {};
              const savedAssistantMessage = result.assistantMessage
                ? normalizeMessage(result.assistantMessage)
                : null;
              const sourceConfidence = result.source_confidence || "none";
              const usedWebSearch = result.used_web_search || false;
              const sources = Array.isArray(result.sources) ? result.sources : [];

              if (result.memory) {
                setMemoryProfile(result.memory);
                setMemoryDraft(draftFromMemory(result.memory));
              }

              if (result.conversation) {
                const updatedConversation = normalizeConversation(result.conversation);
                setConversations((current) => [
                  updatedConversation,
                  ...current.filter((entry) => entry.id !== updatedConversation.id),
                ]);
                setSearchResults((current) => {
                  const searchConversation = {
                    conversationId: updatedConversation.id,
                    title: updatedConversation.title,
                    snippet: updatedConversation.lastMessagePreview || "",
                    updatedAt: updatedConversation.updatedAt || "",
                    type: "conversation",
                  };
                  return [
                    searchConversation,
                    ...current.filter((entry) => entry.conversationId !== updatedConversation.id),
                  ];
                });
              }

              const finalAssistantMessage = {
                ...(savedAssistantMessage || {}),
                id: savedAssistantMessage?.id || imageAssistantId,
                role: "assistant",
                content:
                  savedAssistantMessage?.content ??
                  sanitizeAssistantContent(result.reply || ""),
                sourceConfidence,
                usedWebSearch,
                sources,
              };

              if (!String(finalAssistantMessage.content || "").trim() && !result.image?.url) {
                throw new Error("Image generation completed without a renderable image response.");
              }

              setMessages((current) => [...current, finalAssistantMessage]);

              setSendingActivity("");
              setImageGenerationStatus(null);
              return;
            }
          }

          throw new Error("Image generation is still running. Try refreshing the conversation in a moment.");
        }

        const savedAssistantMessage = data.assistantMessage
          ? normalizeMessage(data.assistantMessage)
          : null;
        const nonStreamingAssistantId = `assistant-nonstream-${Date.now()}`;
        const sourceConfidence = data.source_confidence || "none";
        const usedWebSearch = data.used_web_search || false;
        const sources = Array.isArray(data.sources) ? data.sources : [];

        setMessages((current) => {
          const withoutOptimistic = current.filter((message) => message.id !== optimisticId);
          return [
            ...withoutOptimistic,
            ...(savedUserMessage ? [savedUserMessage] : []),
            ...(savedAssistantMessage
              ? [{ 
                  ...savedAssistantMessage, 
                  id: nonStreamingAssistantId, 
                  content: "",
                  sourceConfidence,
                  usedWebSearch,
                  sources,
                }]
              : []),
          ];
        });

        if (savedAssistantMessage?.content) {
          setSendingActivity(imageGenerationRequested ? "creating-image" : "typing");
          await revealAssistantMessage(nonStreamingAssistantId, savedAssistantMessage.content);
          setMessages((current) =>
            current.map((message) =>
              message.id === nonStreamingAssistantId
                ? {
                    ...savedAssistantMessage,
                    sourceConfidence,
                    usedWebSearch,
                    sources,
                  }
                : message,
            ),
          );
        }
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseEvents(buffer);
          buffer = parsed.remainder;

          for (const item of parsed.events) {
            if (item.event === "meta") {
              const conversationId = item.data.conversationId || activeConversationId;
              setActiveConversationId(conversationId);
              updateConversationUrl(conversationId);

              if (item.data.memory) {
                setMemoryProfile(item.data.memory);
                setMemoryDraft(draftFromMemory(item.data.memory));
              }

              if (item.data.conversation) {
                const updatedConversation = normalizeConversation(item.data.conversation);
                setConversations((current) => [
                  updatedConversation,
                  ...current.filter((entry) => entry.id !== updatedConversation.id),
                ]);
                setSearchResults((current) => {
                  const searchConversation = {
                    conversationId: updatedConversation.id,
                    title: updatedConversation.title,
                    snippet: updatedConversation.lastMessagePreview || "",
                    updatedAt: updatedConversation.updatedAt || "",
                    type: "conversation",
                  };
                  return [
                    searchConversation,
                    ...current.filter((entry) => entry.conversationId !== updatedConversation.id),
                  ];
                });
              }

              const savedUserMessage = item.data.userMessage
                ? normalizeMessage(item.data.userMessage)
                : null;

              setMessages((current) => {
                const withoutOptimistic = current.filter((message) => message.id !== optimisticId);
                return [
                  ...withoutOptimistic,
                  ...(savedUserMessage ? [savedUserMessage] : []),
                  { id: streamingAssistantId, role: "assistant", content: "", sources: [], sourceConfidence: "none", usedWebSearch: false },
                ];
              });
            } else if (item.event === "token") {
              const nextText = String(item.data.text || "");
              setSendingActivity(imageGenerationRequested ? "creating-image" : "typing");
              setMessages((current) =>
                current.map((message) =>
                  message.id === streamingAssistantId
                    ? {
                        ...message,
                        content: `${message.content}${sanitizeAssistantStreamChunk(nextText)}`,
                      }
                    : message,
                ),
              );
            } else if (item.event === "progress") {
              if (imageGenerationRequested) {
                setSendingActivity("creating-image");
                setImageGenerationStatus({
                  title: item.data.title || "Designing image",
                  detail:
                    item.data.detail ||
                    item.data.message ||
                    "Nexa is planning the image design, detail, style, and aspect ratio.",
                  progress: Number(item.data.progress || 0),
                  status: item.data.status || "processing",
                  aspectRatio: item.data.aspect_ratio || item.data.aspectRatio || "1:1",
                  style: item.data.style || "image design",
                });
              }
            } else if (item.event === "done") {
              setSendingActivity("");
              setImageGenerationStatus(null);
              const conversationId = item.data.conversationId || activeConversationId;
              setActiveConversationId(conversationId);
              updateConversationUrl(conversationId);

              if (item.data.memory) {
                setMemoryProfile(item.data.memory);
                setMemoryDraft(draftFromMemory(item.data.memory));
              }

              if (item.data.conversation) {
                const updatedConversation = normalizeConversation(item.data.conversation);
                setConversations((current) => [
                  updatedConversation,
                  ...current.filter((entry) => entry.id !== updatedConversation.id),
                ]);
                setSearchResults((current) => {
                  const searchConversation = {
                    conversationId: updatedConversation.id,
                    title: updatedConversation.title,
                    snippet: updatedConversation.lastMessagePreview || "",
                    updatedAt: updatedConversation.updatedAt || "",
                    type: "conversation",
                  };
                  return [
                    searchConversation,
                    ...current.filter((entry) => entry.conversationId !== updatedConversation.id),
                  ];
                });
              }

              const savedAssistantMessage = item.data.assistantMessage
                ? normalizeMessage(item.data.assistantMessage)
                : null;
              
              const sourceConfidence = item.data.source_confidence || "none";
              const usedWebSearch = item.data.used_web_search || false;
              const sources = Array.isArray(item.data.sources) ? item.data.sources : [];

              setMessages((current) =>
                current.map((message) =>
                  message.id === streamingAssistantId
                    ? {
                        ...message,
                        ...(savedAssistantMessage || {}),
                        id: streamingAssistantId,
                        content:
                          savedAssistantMessage?.content ??
                          sanitizeAssistantContent(item.data.reply || message.content),
                        sourceConfidence,
                        usedWebSearch,
                        sources,
                      }
                    : message,
                ),
              );
            } else if (item.event === "error") {
              setImageGenerationStatus(null);
              throw new Error(item.data.error || "Streaming failed.");
            }
          }
        }

        if (buffer.trim()) {
          const parsed = parseSseEvents(`${buffer}\n\n`);
          for (const item of parsed.events) {
            if (item.event === "error") {
              throw new Error(item.data.error || "Streaming failed.");
            }
          }
        }
      }
    } catch (error) {
      setSendingActivity("");
      setImageGenerationStatus(null);
      setMessages((current) => {
        if (imageGenerationRequested) {
          return current
            .filter((message) => message.id !== streamingAssistantId)
            .concat([
              {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: buildImageGenerationErrorMessage(error),
              },
            ]);
        }

        return current
          .filter(
            (message) => message.id !== optimisticId && message.id !== streamingAssistantId,
          )
          .concat([{ id: `error-${Date.now()}`, role: "assistant", content: `Request failed: ${error.message}` }]);
      });
      setLoadError(error.message || "Failed to send message.");
    } finally {
      setSendingActivity("");
      setImageGenerationStatus(null);
      setIsSending(false);
    }
  }

  async function handleNewChat() {
    setLoadError("");
    setActiveConversationId("");
    setMessages([]);
    setPrompt("");
    setConversationLoading(false);
    setSearchOpen(false);
    setMobileSidebarOpen(false);
    updateConversationUrl("");
  }

  async function handleArchiveConversation(conversationId, archived) {
    const source = archived
      ? conversations.find((item) => item.id === conversationId)
      : archivedConversations.find((item) => item.id === conversationId);

    if (!source) {
      return;
    }

    setArchivingConversationId(conversationId);
    setLoadError("");

    const listSnapshot = {
      conversations: [...conversations],
      archivedConversations: [...archivedConversations],
    };

    const optimistic = {
      ...source,
      archived,
      archivedAt: archived ? new Date().toISOString() : "",
      updatedAt: new Date().toISOString(),
    };
    const { activeItems } = applyLocalConversationMove(
      optimistic,
      archived,
      listSnapshot.conversations,
      listSnapshot.archivedConversations,
    );

    if (archived) {
      setArchivedMenuOpen(true);
    }

    if (activeConversationId === conversationId && archived) {
      const nextActive = activeItems[0];
      if (nextActive) {
        void openConversation(nextActive.id);
      } else {
        setActiveConversationId("");
        setMessages([]);
        updateConversationUrl("");
      }
    }

    try {
      const response = await authorizedFetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update conversation.");
      }
    } catch (error) {
      setConversations(listSnapshot.conversations);
      setArchivedConversations(listSnapshot.archivedConversations);
      setSearchResults([
        ...listSnapshot.conversations,
        ...listSnapshot.archivedConversations,
      ]);
      setDataControls((current) => ({
        ...current,
        counts: {
          active: listSnapshot.conversations.length,
          archived: listSnapshot.archivedConversations.length,
        },
      }));
      setLoadError(error.message || "Failed to update conversation.");
    } finally {
      setArchivingConversationId("");
    }
  }

  async function handleRenameConversation(conversation) {
    const nextTitle = window.prompt("Rename chat", conversation.title);
    if (nextTitle === null) {
      return;
    }

    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === conversation.title) {
      return;
    }

    setLoadError("");

    try {
      const response = await authorizedFetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to rename chat.");
      }

      if (data.conversation) {
        const updated = normalizeConversation(data.conversation);
        setConversations((previous) =>
          sortByUpdatedAt(
            previous.map((entry) => (entry.id === updated.id ? updated : entry)),
          ),
        );
        setArchivedConversations((previous) =>
          sortByUpdatedAt(
            previous.map((entry) => (entry.id === updated.id ? updated : entry)),
          ),
        );
      }
    } catch (error) {
      setLoadError(error.message || "Failed to rename chat.");
    }
  }

  function handleShareConversation(conversationId) {
    const url = `${window.location.origin}/chat?chat=${encodeURIComponent(conversationId)}`;

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
      return;
    }

    window.prompt("Copy chat link", url);
  }

  function handleTogglePin(conversationId) {
    togglePinnedChat(conversationId);
    setPinnedRevision((current) => current + 1);
  }

  async function handleDeleteConversation(conversationId) {
    setDeletingConversationId(conversationId);
    setLoadError("");

    try {
      const response = await authorizedFetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete conversation.");
      }

      setConversations((previous) => {
        const nextActive = previous.filter((item) => item.id !== conversationId);
        setArchivedConversations((archivedPrevious) => {
          const nextArchived = archivedPrevious.filter((item) => item.id !== conversationId);
          setSearchResults([...nextActive, ...nextArchived]);
          setDataControls((current) => ({
            ...current,
            counts: { active: nextActive.length, archived: nextArchived.length },
          }));
          return nextArchived;
        });

        if (activeConversationId === conversationId) {
          if (nextActive[0]) {
            void openConversation(nextActive[0].id);
          } else {
            setActiveConversationId("");
            setMessages([]);
            updateConversationUrl("");
          }
        }

        return nextActive;
      });
    } catch (error) {
      setLoadError(error.message || "Failed to delete conversation.");
    } finally {
      setDeletingConversationId("");
    }
  }

  async function handleUpdateImproveModelForEveryone(nextValue) {
    setDataControlsSaving(true);
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/data-controls", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ improveModelForEveryone: nextValue }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update preference.");
      }

      setDataControls((current) => ({
        ...current,
        improveModelForEveryone: Boolean(data.preferences?.improveModelForEveryone),
        trainingOptInAt: String(data.preferences?.trainingOptInAt || ""),
        trainingOptOutAt: String(data.preferences?.trainingOptOutAt || ""),
      }));
    } catch (error) {
      setLoadError(error.message || "Failed to update preference.");
    } finally {
      setDataControlsSaving(false);
    }
  }

  async function handleArchiveAllChats() {
    if (typeof window !== "undefined" && !window.confirm("Archive all active chats?")) {
      return;
    }

    setBulkActionLoading("archive-all");
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/data-controls/archive-all", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to archive all chats.");
      }
      await refreshConversations();
      await loadDataControls();
    } catch (error) {
      setLoadError(error.message || "Failed to archive all chats.");
    } finally {
      setBulkActionLoading("");
    }
  }

  async function handleDeleteAllChats() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete all chats permanently? This cannot be undone.")
    ) {
      return;
    }

    setBulkActionLoading("delete-all");
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/data-controls/delete-all", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete all chats.");
      }
      setActiveConversationId("");
      setMessages([]);
      updateConversationUrl("");
      await refreshConversations();
      await loadDataControls();
    } catch (error) {
      setLoadError(error.message || "Failed to delete all chats.");
    } finally {
      setBulkActionLoading("");
    }
  }

  async function handleExportData() {
    setExportingData(true);
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/data-controls/export", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to export data.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "nexa-data-export.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      await loadDataControls();
    } catch (error) {
      setLoadError(error.message || "Failed to export data.");
    } finally {
      setExportingData(false);
    }
  }

  async function handleSaveMemory(event) {
    event.preventDefault();
    setMemorySaving(true);
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: memoryDraft.displayName,
          preferredTone: memoryDraft.preferredTone,
          interests: memoryDraft.interestsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          customInstructions: memoryDraft.customInstructions,
          facts: memoryDraft.facts,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save memory.");
      }

      setMemoryProfile(data.memory);
      setMemoryDraft(draftFromMemory(data.memory));
      closeSettings();
    } catch (error) {
      setLoadError(error.message || "Failed to save memory.");
    } finally {
      setMemorySaving(false);
    }
  }

  async function handleLogout() {
    try {
      await authSignOut();
    } catch {
      try {
        await account.deleteSession("current");
      } catch {}
    }

    notifyAuthChanged();
    setAccountSheetOpen(false);
    setCurrentUser(null);
    router.replace("/login");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit(event);
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(recentSearchItems);
  }

  function openSettings(section = "general") {
    setActiveSettingsSection(section);
    setMemoryModalOpen(true);
    setAccountSheetOpen(false);
    setMobileSidebarOpen(false);
    const settingsPath =
      section === "general" || section === "account"
        ? "/settings/profile"
        : section === "billing"
          ? "/settings/billing"
        : section === "data-controls"
          ? "/settings/data"
          : `/settings/${section}`;
    router.push(settingsPath);
  }

  function closeSettings() {
    setMemoryModalOpen(false);
    setActiveSettingsSection("general");
    if (routeMode === "settings") {
      router.replace("/chat");
    }
  }

  function handleShowArchivedChats() {
    setArchivedMenuOpen(true);
    setMobileSidebarOpen(true);
  }

  function addFact() {
    const value = memoryDraft.newFact.trim();
    if (!value) {
      return;
    }

    setMemoryDraft((current) => ({
      ...current,
      facts: current.facts.includes(value) ? current.facts : [...current.facts, value],
      newFact: "",
    }));
  }

  function selectThinkingMode(value) {
    setResponseLength(value);
    setAddMenuOpen("");
  }

  function renderAddMenu(menuId, { mobile = false } = {}) {
    return (
      <div data-add-menu-root className="absolute bottom-3 left-3 z-20">
        {mobile && addMenuOpen === menuId ? (
          <div className="absolute bottom-[calc(100%+12px)] left-0 w-[240px] rounded-[32px] border border-black/10 bg-white p-3 shadow-[0_24px_80px_rgba(17,17,17,0.18)]">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <img src={thinkingIcon.src} alt="" className="h-5 w-5 rounded-sm object-contain" />
              <div>
                <div className="text-sm font-medium text-ink">Thinking</div>
                <div className="text-xs text-muted">Choose a response mode</div>
              </div>
            </div>
            <div className="mt-1 space-y-1">
              {THINKING_MODES.map((mode) => {
                const selected = String(responseLength) === String(mode.value);
                return (
                  <button
                    key={String(mode.value)}
                    type="button"
                    onClick={() => selectThinkingMode(mode.value)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-black/[0.03]",
                      selected ? "bg-black/[0.04]" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex h-2.5 w-2.5 rounded-full transition",
                        selected ? "bg-[#9ad97b]" : "bg-black/10",
                      ].join(" ")}
                    />
                    <span className="min-w-0 flex-1 text-sm text-ink">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (!mobile) {
              return;
            }
            setAddMenuOpen((current) => (current === menuId ? "" : menuId));
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-lg text-muted shadow-soft transition hover:bg-black/[0.03] hover:text-ink"
          aria-label="Add"
          aria-expanded={mobile ? addMenuOpen === menuId : undefined}
        >
          +
        </button>
      </div>
    );
  }

  function renderInlineThinkingSelector(menuId) {
    const currentMode =
      THINKING_MODES.find((mode) => String(mode.value) === String(responseLength)) ||
      THINKING_MODES[0];

    return (
      <div data-add-menu-root className="absolute bottom-3 right-14 z-20 hidden sm:block">
        {addMenuOpen === menuId ? (
          <div className="absolute bottom-[calc(100%+12px)] right-0 w-[240px] rounded-[32px] border border-black/10 bg-white p-3 shadow-[0_24px_80px_rgba(17,17,17,0.18)]">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <img src={thinkingIcon.src} alt="" className="h-5 w-5 rounded-sm object-contain" />
              <div>
                <div className="text-sm font-medium text-ink">Thinking</div>
                <div className="text-xs text-muted">Choose a response mode</div>
              </div>
            </div>
            <div className="mt-1 space-y-1">
              {THINKING_MODES.map((mode) => {
                const selected = String(responseLength) === String(mode.value);
                return (
                  <button
                    key={String(mode.value)}
                    type="button"
                    onClick={() => selectThinkingMode(mode.value)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-black/[0.03]",
                      selected ? "bg-black/[0.04]" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex h-2.5 w-2.5 rounded-full transition",
                        selected ? "bg-[#9ad97b]" : "bg-black/10",
                      ].join(" ")}
                    />
                    <span className="min-w-0 flex-1 text-sm text-ink">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setAddMenuOpen((current) => (current === menuId ? "" : menuId))}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink shadow-soft transition hover:bg-black/[0.03]"
          aria-label="Response Length"
          aria-expanded={addMenuOpen === menuId}
        >
          <img src={thinkingIcon.src} alt="" className="h-4 w-4 rounded-sm object-contain opacity-80" />
          <span>{currentMode.label}</span>
        </button>
      </div>
    );
  }

  function renderResponseLengthSelector({ mobile = false } = {}) {
    return (
      <div
        className={[
          "px-1",
          mobile
            ? "mt-3 flex flex-col items-center gap-2"
            : "mt-3 flex items-center justify-end gap-2",
        ].join(" ")}
      >
        <span
          className={[
            "text-muted",
            mobile
              ? "text-[11px] font-semibold uppercase tracking-[0.18em]"
              : "text-xs font-medium",
          ].join(" ")}
        >
          Response Length
        </span>
        <select
          value={String(responseLength)}
          onChange={(event) =>
            setResponseLength(
              event.target.value === "auto" ? "auto" : Number(event.target.value),
            )
          }
          className={[
            "rounded-full border border-line bg-panel text-ink outline-none shadow-soft",
            mobile
              ? "min-w-[168px] px-4 py-2 text-sm"
              : "px-3 py-1.5 text-xs",
          ].join(" ")}
          aria-label="Response Length"
        >
          {RESPONSE_LENGTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderSettingsContent() {
    if (activeSettingsSection === "memory") {
      return (
        <div>
          {loadError ? (
            <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {loadError}
            </div>
          ) : null}

          <section className="pb-6">
            <div className="mb-4">
              <div className="text-base font-medium text-ink">Memory profile</div>
              <div className="mt-1 text-sm text-muted">
                Basic identity and response style used across chats.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-sm font-medium text-ink">Display name</div>
                <input
                  type="text"
                  value={memoryDraft.displayName}
                  onChange={(event) =>
                    setMemoryDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="w-full rounded-[22px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-black/15"
                />
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-medium text-ink">Preferred tone</div>
                <input
                  type="text"
                  value={memoryDraft.preferredTone}
                  onChange={(event) =>
                    setMemoryDraft((current) => ({
                      ...current,
                      preferredTone: event.target.value,
                    }))
                  }
                  className="w-full rounded-[22px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-black/15"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <div className="mb-2 text-sm font-medium text-ink">Interests</div>
              <input
                type="text"
                value={memoryDraft.interestsText}
                onChange={(event) =>
                  setMemoryDraft((current) => ({
                    ...current,
                    interestsText: event.target.value,
                  }))
                }
                placeholder="AI, robotics, design"
                className="w-full rounded-[22px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-black/15"
              />
            </label>

            <label className="mt-4 block">
              <div className="mb-2 text-sm font-medium text-ink">Custom instructions</div>
              <textarea
                value={memoryDraft.customInstructions}
                onChange={(event) =>
                  setMemoryDraft((current) => ({
                    ...current,
                    customInstructions: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-[22px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-black/15"
              />
            </label>
          </section>

          <section className="border-t border-black/6 pt-6">
            <div className="mb-4">
              <div className="text-base font-medium text-ink">Saved facts</div>
              <div className="mt-1 text-sm text-muted">
                Keep stable details here so Nexa can reuse them later.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {memoryDraft.facts.length > 0 ? (
                memoryDraft.facts.map((fact) => (
                  <span
                    key={fact}
                    className="inline-flex items-center gap-2 rounded-full bg-black/[0.05] px-3 py-2 text-sm text-ink"
                  >
                    <span>{fact}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setMemoryDraft((current) => ({
                          ...current,
                          facts: current.facts.filter((item) => item !== fact),
                        }))
                      }
                      className="text-muted transition hover:text-ink"
                    >
                      x
                    </button>
                  </span>
                ))
              ) : (
                <div className="text-sm text-muted">No saved facts yet.</div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={memoryDraft.newFact}
                onChange={(event) =>
                  setMemoryDraft((current) => ({
                    ...current,
                    newFact: event.target.value,
                  }))
                }
                placeholder="Add a fact"
                className="flex-1 rounded-[22px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-black/15"
              />
              <button
                type="button"
                onClick={addFact}
                className="rounded-[22px] bg-black/[0.06] px-4 py-3 text-sm font-medium text-ink transition hover:bg-black/[0.1]"
              >
                Add
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={memorySaving}
                className="rounded-[22px] bg-ink px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {memorySaving ? "Saving..." : "Save memory"}
              </button>
            </div>
          </section>
        </div>
      );
    }

    if (activeSettingsSection === "general") {
      return (
        <div>
          <div className="pb-5">
            <div className="text-base font-medium text-ink">General</div>
            <div className="mt-1 text-sm text-muted">
              Core product preferences for your Nexa workspace.
            </div>
          </div>
          <section className="border-t border-black/6">
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-ink">Appearance</div>
                <div className="mt-1 text-xs text-muted">Theme preference for the interface.</div>
              </div>
              <div className="text-sm text-ink">System</div>
            </div>
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-ink">Language</div>
                <div className="mt-1 text-xs text-muted">UI and assistant defaults.</div>
              </div>
              <div className="text-sm text-ink">Auto-detect</div>
            </div>
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-ink">Account</div>
                <div className="mt-1 text-xs text-muted">Signed in as {currentUser?.email || "Unknown"}.</div>
              </div>
              <div className="text-sm text-ink">Active</div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-medium text-ink">Memory</div>
                <div className="mt-1 text-xs text-muted">Manage what Nexa remembers about you.</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSettingsSection("memory")}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-ink transition hover:bg-black/[0.03]"
              >
                Open
              </button>
            </div>
          </section>
        </div>
      );
    }

    if (activeSettingsSection === "data-controls") {
      return (
        <div>
          {loadError ? (
            <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {loadError}
            </div>
          ) : null}

          <section className="border-t border-black/6">
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-ink">Improve the model for everyone</div>
                <div className="mt-1 text-xs text-muted">
                  Allow your opted-in chats to help improve Nexa over time.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  void handleUpdateImproveModelForEveryone(
                    !dataControls.improveModelForEveryone,
                  )
                }
                disabled={dataControlsSaving}
                className={[
                  "inline-flex min-w-[72px] items-center justify-center rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-60",
                  dataControls.improveModelForEveryone
                    ? "border-black/15 bg-black/[0.06] text-ink"
                    : "border-line bg-white text-muted",
                ].join(" ")}
              >
                {dataControlsSaving
                  ? "Saving..."
                  : dataControls.improveModelForEveryone
                    ? "On"
                  : "Off"}
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-ink">Archived chats</div>
                <div className="mt-1 text-xs text-muted">
                  {dataControls.counts.archived} archived chat{dataControls.counts.archived === 1 ? "" : "s"}.
                </div>
              </div>
              <button
                type="button"
                onClick={handleShowArchivedChats}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-ink transition hover:bg-black/[0.03]"
              >
                View
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-ink">Archive all chats</div>
                <div className="mt-1 text-xs text-muted">
                  Move every active chat into Archived without deleting it.
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleArchiveAllChats()}
                disabled={bulkActionLoading === "archive-all" || conversations.length === 0}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-ink transition hover:bg-black/[0.03] disabled:opacity-60"
              >
                {bulkActionLoading === "archive-all" ? "Archiving..." : "Archive all"}
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-ink">Delete all chats</div>
                <div className="mt-1 text-xs text-muted">
                  Permanently delete active and archived chats for this account.
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleDeleteAllChats()}
                disabled={
                  bulkActionLoading === "delete-all" ||
                  dataControls.counts.active + dataControls.counts.archived === 0
                }
                className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {bulkActionLoading === "delete-all" ? "Deleting..." : "Delete all"}
              </button>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-ink">Export data</div>
                <div className="mt-1 text-xs text-muted">
                  Download Nexa-format JSONL plus raw profile, preferences, chats, and messages.
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleExportData()}
                disabled={exportingData}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-ink transition hover:bg-black/[0.03] disabled:opacity-60"
              >
                {exportingData ? "Exporting..." : "Export"}
              </button>
            </div>

            {dataControls.trainingOptInAt || dataControls.trainingOptOutAt ? (
              <div className="border-t border-black/6 px-5 py-4 text-xs text-muted">
                {dataControls.trainingOptInAt ? (
                  <div>Last opted in: {new Date(dataControls.trainingOptInAt).toLocaleString()}</div>
                ) : null}
                {dataControls.trainingOptOutAt ? (
                  <div className={dataControls.trainingOptInAt ? "mt-1" : ""}>
                    Last opted out: {new Date(dataControls.trainingOptOutAt).toLocaleString()}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      );
    }

    if (activeSettingsSection === "billing") {
      return (
        <div>
          {loadError ? (
            <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {loadError}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-line bg-white p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="text-base font-medium text-ink">{NEXA_PLUS_PLAN.name}</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-semibold text-ink">{NEXA_PLUS_PLAN.price}</span>
                  <span className="pb-1 text-sm text-muted">{NEXA_PLUS_PLAN.period}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{NEXA_PLUS_PLAN.description}</p>
                <ul className="mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2">
                  {NEXA_PLUS_PLAN.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span aria-hidden>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full max-w-sm rounded-[24px] border border-line bg-shell p-4">
                <div className="mb-3 text-sm font-medium text-ink">Subscribe with PayPal</div>
                <PayPalSubscribeButton />
                <p className="mt-3 text-xs leading-5 text-muted">
                  Your subscription is linked to {currentUser?.email || "this account"} after PayPal approval.
                </p>
              </div>
            </div>
          </section>
        </div>
      );
    }

    const activeSectionLabel =
      SETTINGS_SECTIONS.find((section) => section.id === activeSettingsSection)?.label ||
      "Settings";

    return (
      <section className="pt-1">
        <div className="text-base font-medium text-ink">{activeSectionLabel}</div>
        <div className="mt-2 text-sm leading-6 text-muted">
          This section is reserved for the next settings pass. Memory settings are fully functional now.
        </div>
      </section>
    );
  }

  const showChatTopBar = !isEmpty || Boolean(activeConversationId);

  return (
    <div className="flex h-screen overflow-hidden bg-chat-surface text-ink">
      <aside
        className={[
          "shrink-0 overflow-hidden border-r border-chat-border bg-chat-sidebar transition-[width] duration-200 ease-out md:flex md:flex-col",
          sidebarOpen ? "hidden w-[260px] md:flex" : "hidden w-[52px] md:flex",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center gap-1 p-2",
            sidebarOpen ? "justify-between" : "flex-col",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-chat-hover"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <IconSidebar />
          </button>
          {sidebarOpen ? (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-chat-hover"
              aria-label="Search chats"
            >
              <IconSearch />
            </button>
          ) : null}
        </div>

        {currentUser ? (
          <ChatArchivedDropdown
            open={archivedMenuOpen}
            onToggle={setArchivedMenuOpen}
            archivedConversations={sortedArchivedConversations}
            activeConversationId={activeConversationId}
            sidebarOpen={sidebarOpen}
            onOpenConversation={(conversationId) => void openConversation(conversationId)}
            onShare={handleShareConversation}
            onRename={(conversation) => void handleRenameConversation(conversation)}
            onPin={handleTogglePin}
            onUnarchive={(conversationId) => void handleArchiveConversation(conversationId, false)}
            onDelete={(conversationId) => void handleDeleteConversation(conversationId)}
          />
        ) : null}

        <div className={sidebarOpen ? "px-2" : "flex justify-center px-1"}>
          <button
            type="button"
            onClick={handleNewChat}
            className={[
              "flex items-center text-sm font-medium text-ink transition hover:bg-chat-hover",
              sidebarOpen
                ? "w-full gap-2 rounded-lg border border-chat-border px-3 py-2"
                : "h-9 w-9 justify-center rounded-lg",
            ].join(" ")}
            disabled={!currentUser}
            aria-label="New chat"
            title="New chat"
          >
            <IconNewChat />
            {sidebarOpen ? <span>New chat</span> : null}
          </button>
        </div>

        {sidebarOpen ? (
          <>
            <div className="chat-scroll mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              <div className="space-y-0.5">
                {sortedConversations.map((conversation) => (
                  <ChatConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    active={activeConversationId === conversation.id}
                    isPinned={isChatPinned(conversation.id)}
                    onOpen={() => void openConversation(conversation.id)}
                    onShare={() => handleShareConversation(conversation.id)}
                    onRename={() => void handleRenameConversation(conversation)}
                    onPin={() => handleTogglePin(conversation.id)}
                    onArchive={() => void handleArchiveConversation(conversation.id, true)}
                    onDelete={() => void handleDeleteConversation(conversation.id)}
                  />
                ))}
                {archivingConversationId ? (
                  <p className="px-3 py-2 text-xs text-chat-muted">Updating archive...</p>
                ) : null}
              </div>
            </div>

            <div className="relative mt-auto border-t border-chat-border p-2">
              {currentUser ? (
                <>
                  {accountSheetOpen ? (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-full rounded-xl border border-chat-border bg-chat-surface p-1.5 shadow-chat-popover">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-chat-hover"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                          {(currentUser.name || currentUser.email || "N").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink">
                            {currentUser.name || "User"}
                          </div>
                          <div className="truncate text-xs text-muted">{currentUser.email}</div>
                        </div>
                        <img src={nextIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                      </button>

                      <div className="my-2 border-t border-line" />

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => openSettings("billing")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">*</span>
                          <span>Upgrade plan</span>
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">o</span>
                          <span>Personalization</span>
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">@</span>
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openSettings("general");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <img src={settingsIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                          <span>Settings</span>
                        </button>
                      </div>

                      <div className="my-2 border-t border-line" />

                      <div className="space-y-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">?</span>
                          <span className="flex-1">Help</span>
                          <img src={nextIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                        </button>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">-</span>
                          <span className="flex-1">Log out</span>
                          <img src={nextIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setAccountSheetOpen((current) => !current)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-chat-hover"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                      {(currentUser.name || currentUser.email || "N").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {currentUser.name || "User"}
                      </div>
                      <div className="truncate text-xs text-chat-muted">Account</div>
                    </div>
                  </button>
                </>
              ) : (
                <div className="px-3 py-3 text-sm text-chat-muted">
                  {authLoading ? "Checking session..." : "Sign in to save your chats."}
                </div>
              )}
            </div>
          </>
        ) : null}
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-chat-surface">
        {!showChatTopBar ? (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-chat-border px-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-chat-hover"
              aria-label="Open sidebar"
            >
              <IconSidebar />
            </button>
            <span className="text-sm font-medium">{assistantName}</span>
            <button
              type="button"
              onClick={() => void handleNewChat()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-chat-hover"
              aria-label="New chat"
            >
              <IconNewChat />
            </button>
          </div>
        ) : null}

        {showChatTopBar && !authLoading && !workspaceLoading && currentUser ? (
          <ChatTopBar
            assistantName={assistantName}
            responseLength={responseLength}
            onSelectMode={selectThinkingMode}
            addMenuOpen={addMenuOpen}
            setAddMenuOpen={setAddMenuOpen}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
        ) : null}

        {authLoading || workspaceLoading ? (
          <section className="flex flex-1 items-center justify-center">
            <div className="text-sm text-chat-muted">Loading...</div>
          </section>
        ) : currentUser ? (
          <>
            <section
              ref={listRef}
              className={[
                "chat-scroll min-h-0 flex-1 overflow-y-auto",
                isEmpty ? "flex flex-col" : "px-4 py-6 md:px-6",
              ].join(" ")}
            >
              {loadError ? (
                <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loadError}
                </div>
              ) : null}

              {isEmpty && !loadError && !conversationLoading ? (
                <ChatEmptyState
                  assistantName={assistantName}
                  onSuggestionClick={setPrompt}
                />
              ) : (
                <ChatMessages
                  messages={messages}
                  assistantName={memoryProfile?.displayName || assistantName}
                  isSending={isSending}
                  sendingActivity={sendingActivity}
                  imageGenerationStatus={imageGenerationStatus}
                  conversationLoading={conversationLoading}
                />
              )}
            </section>

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-chat-border bg-gradient-to-t from-chat-surface via-chat-surface to-transparent px-4 pb-5 pt-3 md:px-6"
            >
              <ChatComposer
                prompt={prompt}
                setPrompt={setPrompt}
                onKeyDown={handleKeyDown}
                isSending={isSending}
                placeholder={isEmpty ? "Ask anything" : `Message ${assistantName}`}
                responseLength={responseLength}
                onSelectMode={selectThinkingMode}
                addMenuOpen={addMenuOpen}
                setAddMenuOpen={setAddMenuOpen}
                menuId={isEmpty ? "composer-empty" : "composer-active"}
              />
            </form>
          </>
        ) : null}
      </main>

      {accountSheetOpen ? (
        <button
          type="button"
          aria-label="Close account menu"
          onClick={() => setAccountSheetOpen(false)}
          className="fixed inset-0 z-40 hidden bg-transparent md:block"
        />
      ) : null}

      {mobileSidebarOpen ? (
        <>
          <button
            type="button"
            aria-label="Close mobile sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-chat-border bg-chat-sidebar md:hidden">
            <div className="flex items-center justify-between p-2">
              <NexaMark className="h-8 w-8 text-xs" />
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-chat-hover"
                aria-label="Close sidebar"
              >
                <IconSidebar />
              </button>
            </div>

            {currentUser ? (
              <ChatArchivedDropdown
                open={archivedMenuOpen}
                onToggle={setArchivedMenuOpen}
                archivedConversations={sortedArchivedConversations}
                activeConversationId={activeConversationId}
                sidebarOpen
                onOpenConversation={(conversationId) => {
                  void openConversation(conversationId);
                  setMobileSidebarOpen(false);
                }}
                onShare={handleShareConversation}
                onRename={(conversation) => void handleRenameConversation(conversation)}
                onPin={handleTogglePin}
                onUnarchive={(conversationId) => void handleArchiveConversation(conversationId, false)}
                onDelete={(conversationId) => void handleDeleteConversation(conversationId)}
              />
            ) : null}

            <div className="px-2">
              <button
                type="button"
                onClick={() => {
                  handleNewChat();
                  setMobileSidebarOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-chat-border px-3 py-2 text-sm font-medium transition hover:bg-chat-hover"
                disabled={!currentUser}
              >
                <IconNewChat />
                New chat
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-chat-hover"
              >
                <IconSearch />
                Search chats
              </button>
            </div>

            <div className="chat-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-2">
              <div className="space-y-0.5">
                {sortedConversations.map((conversation) => (
                  <ChatConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    active={activeConversationId === conversation.id}
                    isPinned={isChatPinned(conversation.id)}
                    onOpen={() => {
                      void openConversation(conversation.id);
                      setMobileSidebarOpen(false);
                    }}
                    onShare={() => handleShareConversation(conversation.id)}
                    onRename={() => void handleRenameConversation(conversation)}
                    onPin={() => handleTogglePin(conversation.id)}
                    onArchive={() => void handleArchiveConversation(conversation.id, true)}
                    onDelete={() => void handleDeleteConversation(conversation.id)}
                  />
                ))}
                {archivingConversationId ? (
                  <p className="px-3 py-2 text-xs text-chat-muted">Updating archive...</p>
                ) : null}
              </div>
            </div>

            <div className="relative mt-auto pt-4">
              {currentUser ? (
                <>
                  {accountSheetOpen ? (
                    <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 w-full overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.18)]">
                      <div className="px-4 pb-3 pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d7dd2] text-sm font-semibold text-white">
                            {(currentUser.name || currentUser.email || "N").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-ink">
                              {currentUser.name || "User"}
                            </div>
                            <div className="truncate text-xs text-muted">{currentUser.email}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mx-3 rounded-[22px] bg-black/[0.03] p-2">
                        <button
                          type="button"
                          onClick={() => openSettings("billing")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">*</span>
                          <span>Upgrade plan</span>
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">o</span>
                          <span>Personalization</span>
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">@</span>
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openSettings("general");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <img src={settingsIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                          <span>Settings</span>
                        </button>
                      </div>

                      <div className="mx-3 mb-3 mt-3 rounded-[22px] bg-black/[0.03] p-2">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">?</span>
                          <span className="flex-1">Help</span>
                          <img src={nextIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover:bg-black/[0.03]"
                        >
                          <span className="w-4 text-center text-[15px] text-muted">-</span>
                          <span className="flex-1">Log out</span>
                          <img src={nextIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setAccountSheetOpen((current) => !current)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white/60 px-3 py-3 text-left transition hover:bg-white/85"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d7dd2] text-sm font-semibold text-white">
                      {(currentUser.name || currentUser.email || "N").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {currentUser.name || "User"}
                      </div>
                      <div className="truncate text-xs text-muted">{currentUser.email}</div>
                    </div>
                    <img src={nextIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                  </button>
                </>
              ) : (
                <div className="rounded-2xl border border-black/5 bg-white/60 px-3 py-3 text-sm text-muted">
                  {authLoading ? "Checking session..." : "Sign in to save your chats."}
                </div>
              )}
            </div>
          </aside>
        </>
      ) : null}

      {searchOpen ? (
        <>
          <button
            type="button"
            aria-label="Close search"
            onClick={closeSearch}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
            <div className="w-full max-w-[680px] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.18)]">
              <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search chats..."
                  className="flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-[28px] leading-none text-muted transition hover:text-ink"
                  aria-label="Close search"
                >
                  x
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto px-3 py-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleNewChat();
                    closeSearch();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] transition hover:bg-black/[0.03]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-lg text-ink">
                    +
                  </span>
                  <span>New chat</span>
                </button>

                <div className="my-2 border-t border-line" />

                {searchLoading ? (
                  <div className="px-4 py-10 text-center text-sm text-muted">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((item) => (
                      <button
                        key={`${item.conversationId}-${item.type}`}
                        type="button"
                        onClick={() => void openConversation(item.conversationId)}
                        className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-black/[0.03]"
                      >
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-xs font-medium uppercase text-muted">
                          {item.type === "message" ? (item.role === "user" ? "You" : assistantName.slice(0, 1)) : "C"}
                        </span>
                        <div className="min-w-0">
                          <div className="mb-1 truncate text-sm font-medium text-ink">{item.title}</div>
                          <div className="line-clamp-2 text-sm text-muted">
                            {item.snippet || "No preview"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-muted">
                    No chats found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {memoryModalOpen ? (
        <>
          <button
            type="button"
            aria-label="Close settings"
            onClick={closeSettings}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[4px]"
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center px-0 pt-10 sm:items-center sm:px-4">
            <form
              onSubmit={handleSaveMemory}
              className="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-[32px] border border-black/10 bg-[#fcfcfb] shadow-[0_24px_80px_rgba(17,17,17,0.18)] sm:max-h-[88vh] sm:rounded-[32px]"
            >
              <div className="border-b border-black/6 px-5 pb-3 pt-4 sm:px-6">
                <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-black/10 sm:hidden" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Settings
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeSettings}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/6 bg-white transition hover:bg-black/[0.03]"
                  >
                    <img src={closeIcon.src} alt="" className="h-4 w-4 object-contain opacity-70" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="pr-4 md:border-r md:border-black/6 md:pr-5">
                    <div className="space-y-1">
                      {SETTINGS_SECTIONS.map((section) => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSettingsSection(section.id)}
                          className={[
                            "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition",
                            activeSettingsSection === section.id
                              ? "bg-black/[0.05] font-medium text-ink"
                              : "text-muted hover:bg-black/[0.03] hover:text-ink",
                          ].join(" ")}
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center text-[13px] text-current">
                            {typeof section.icon === "string" && section.icon.startsWith("/") ? (
                              <img src={section.icon} alt="" className="h-4 w-4 object-contain opacity-75" />
                            ) : (
                              section.icon
                            )}
                          </span>
                          <span>{section.label}</span>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className="min-w-0 md:pl-1">
                    <div className="mb-4 px-1">
                      <div className="text-[26px] font-semibold leading-tight text-ink">
                        {SETTINGS_SECTIONS.find((section) => section.id === activeSettingsSection)?.label}
                      </div>
                    </div>
                    {renderSettingsContent()}
                  </div>
                </div>
              </div>

            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
