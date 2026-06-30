import { AppwriteException, ID, Query } from "node-appwrite";

import {
  conversationsCollectionId,
  createAdminDatabases,
  databaseId,
  messagesCollectionId,
  ownerPermissions,
  userMemoryCollectionId,
  userPreferencesCollectionId,
} from "./appwrite";

export const DEFAULT_CONVERSATION_TITLE = "New Conversation";
export const DEFAULT_DATA_CONTROLS = {
  improveModelForEveryone: false,
  updatedAt: null,
  lastExportAt: null,
  lastArchiveAllAt: null,
  lastDeleteAllAt: null,
  trainingOptInAt: null,
  trainingOptOutAt: null,
};

function truncate(value, maxLength = 80) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function uniqueStrings(values) {
  const seen = new Set();
  const items = [];

  for (const raw of values || []) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(value);
  }

  return items;
}

function toTitleCase(value) {
  const uppercaseWords = new Set(["ai", "api", "ui", "ux", "ml"]);
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "for",
    "from",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
  ]);

  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (uppercaseWords.has(lower)) {
        return lower.toUpperCase();
      }
      if (index !== 0 && index !== words.length - 1 && stopWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function cleanDomainCandidate(value) {
  return String(value || "")
    .replace(/\blike [^.?!,\n]+/i, "")
    .replace(/\bthat\b.*$/i, "")
    .replace(/\bwhich\b.*$/i, "")
    .replace(/\bwith\b.*$/i, "")
    .replace(/\busing\b.*$/i, "")
    .replace(/\brunning on\b.*$/i, "")
    .replace(/\bruns on\b.*$/i, "")
    .replace(/\bi need\b.*$/i, "")
    .replace(/\bi want\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSubjectTitle(domain) {
  const cleaned = cleanDomainCandidate(domain);
  if (!cleaned) {
    return "";
  }

  const objectMatch = cleaned.match(
    /\b(app|application|platform|system|tool|assistant|dashboard|website|bot)\b\s+for\s+(.+)$/i,
  );
  if (objectMatch?.[1] && objectMatch?.[2]) {
    const objectType =
      objectMatch[1].toLowerCase() === "application" ? "App" : toTitleCase(objectMatch[1]);
    const subject = toTitleCase(objectMatch[2].trim().split(/\s+/).slice(0, 3).join(" "));
    return `${subject} ${objectType}`.trim();
  }

  const words = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((word, index) => !(index === 0 && /^(local|custom|own|new)$/i.test(word)));

  return toTitleCase(words.slice(0, 3).join(" "));
}

export function buildConversationTitle(input) {
  const text = String(input || "").trim().replace(/\s+/g, " ");
  if (!text) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  const normalized = text.replace(/[?!.]+$/g, "").trim();
  const lower = normalized.toLowerCase();

  if (/^(hi|hello|hey|yo|sup|hola)\b/.test(lower) && normalized.split(/\s+/).length <= 3) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  const personMatch = normalized.match(
    /\bwho is ([a-z][a-z.'-]*(?:\s+[a-z][a-z.'-]*){0,3})\b/i,
  );
  if (personMatch?.[1]) {
    const name = toTitleCase(personMatch[1].trim());
    if (/\bnet\s*worth\b/i.test(normalized) || /\bworth\b/i.test(normalized)) {
      return `${name} Net Worth`;
    }
    if (/\bhow many companies\b/i.test(normalized) || /\bcompanies\b/i.test(normalized)) {
      return `${name} Companies`;
    }
    return name;
  }

  const whatIsMatch = normalized.match(/\bwhat is ([^?]+)/i);
  if (whatIsMatch?.[1]) {
    return truncate(toTitleCase(whatIsMatch[1].trim()), 40);
  }

  const howToMatch = normalized.match(/\bhow to ([^?]+)/i);
  if (howToMatch?.[1]) {
    return truncate(`How to ${howToMatch[1].trim()}`, 40);
  }

  const architectureIntent =
    /\b(architecture|database|authentication|analytics|notification|memory|streaming|subscriptions|sync|scal(?:e|ing)|flow)\b/.test(
      lower,
    );
  const buildIntent = /\b(build|creating|create|make|design|structure|develop)\b/.test(lower);
  if (architectureIntent || buildIntent) {
    const actionMatch = normalized.match(
      /\b(?:build|creating|create|make|design|structure|develop)(?:\s+(?:a|an|the|my|own))?\s+(.+?)(?:\s+\bthat\b|\s+\bwhich\b|\s+\bwith\b|\s+\busing\b|\s+\bi need\b|\s+\bi want\b|$)/i,
    );
    const subjectMatch = actionMatch?.[1] ? buildSubjectTitle(actionMatch[1]) : "";

    if (subjectMatch) {
      return architectureIntent ? `${subjectMatch} Architecture` : subjectMatch;
    }
  }

  const cleaned = normalized
    .replace(
      /^(who is|what is|tell me about|explain|show me|give me|can you|please|i(?:'m| am) trying to build|i want to understand|help me build|help me create|i want to create|i want to build)\s+/i,
      "",
    )
    .replace(/\b(my|the|a|an)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 0) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  return truncate(toTitleCase(words.slice(0, 4).join(" ")), 40);
}

function cleanCommaList(value) {
  return uniqueStrings(
    String(value || "")
      .split(",")
      .map((item) => item.trim()),
  );
}

function sanitizeMemoryInput(input = {}) {
  return {
    displayName: String(input.displayName || "").trim(),
    preferredTone: String(input.preferredTone || "").trim(),
    interests: Array.isArray(input.interests)
      ? uniqueStrings(input.interests)
      : cleanCommaList(input.interests),
    customInstructions: String(input.customInstructions || "").trim(),
    facts: Array.isArray(input.facts) ? uniqueStrings(input.facts) : uniqueStrings([]),
  };
}

export function serializeMemory(document) {
  if (!document) {
    return {
      displayName: "",
      preferredTone: "",
      interests: [],
      customInstructions: "",
      facts: [],
      updatedAt: null,
    };
  }

  return {
    displayName: document.displayName || "",
    preferredTone: document.preferredTone || "",
    interests: Array.isArray(document.interests) ? document.interests : [],
    customInstructions: document.customInstructions || "",
    facts: Array.isArray(document.facts) ? document.facts : [],
    updatedAt: document.updatedAt || document.$updatedAt || null,
  };
}

function parseBooleanString(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return String(value ?? "").toLowerCase() === "true";
}

function serializeConversation(document) {
  return {
    ...document,
    archived: parseBooleanString(document?.archived),
    archivedAt: document?.archivedAt || null,
  };
}

function sanitizePreferencesInput(input = {}) {
  return {
    improveModelForEveryone: Boolean(input.improveModelForEveryone),
    updatedAt: String(input.updatedAt || "").trim(),
    lastExportAt: String(input.lastExportAt || "").trim(),
    lastArchiveAllAt: String(input.lastArchiveAllAt || "").trim(),
    lastDeleteAllAt: String(input.lastDeleteAllAt || "").trim(),
    trainingOptInAt: String(input.trainingOptInAt || "").trim(),
    trainingOptOutAt: String(input.trainingOptOutAt || "").trim(),
  };
}

function serializePreferences(document) {
  if (!document) {
    return { ...DEFAULT_DATA_CONTROLS };
  }

  return {
    improveModelForEveryone: parseBooleanString(document.improveModelForEveryone),
    updatedAt: document.updatedAt || document.$updatedAt || null,
    lastExportAt: document.lastExportAt || null,
    lastArchiveAllAt: document.lastArchiveAllAt || null,
    lastDeleteAllAt: document.lastDeleteAllAt || null,
    trainingOptInAt: document.trainingOptInAt || null,
    trainingOptOutAt: document.trainingOptOutAt || null,
  };
}

export async function getUserMemory(userId) {
  const databases = createAdminDatabases();

  try {
    const document = await databases.getDocument(databaseId, userMemoryCollectionId, userId);
    return serializeMemory(document);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return serializeMemory(null);
    }

    throw error;
  }
}

export async function upsertUserMemory(userId, patch = {}) {
  const databases = createAdminDatabases();
  const current = await getUserMemory(userId);
  const cleaned = sanitizeMemoryInput({ ...current, ...patch });
  const now = new Date().toISOString();
  const payload = {
    userId,
    displayName: cleaned.displayName,
    preferredTone: cleaned.preferredTone,
    interests: cleaned.interests,
    customInstructions: cleaned.customInstructions,
    facts: cleaned.facts,
    updatedAt: now,
  };

  try {
    const document = await databases.updateDocument(
      databaseId,
      userMemoryCollectionId,
      userId,
      payload,
      ownerPermissions(userId),
    );
    return serializeMemory(document);
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      throw error;
    }
  }

  const document = await databases.createDocument(
    databaseId,
    userMemoryCollectionId,
    userId,
    payload,
    ownerPermissions(userId),
  );
  return serializeMemory(document);
}

export async function getUserPreferences(userId) {
  const databases = createAdminDatabases();

  try {
    const document = await databases.getDocument(
      databaseId,
      userPreferencesCollectionId,
      userId,
    );
    return serializePreferences(document);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return serializePreferences(null);
    }

    throw error;
  }
}

export async function upsertUserPreferences(userId, patch = {}) {
  const databases = createAdminDatabases();
  const current = await getUserPreferences(userId);
  const now = new Date().toISOString();
  const nextImproveModel =
    typeof patch.improveModelForEveryone === "boolean"
      ? patch.improveModelForEveryone
      : current.improveModelForEveryone;
  const transitions = {
    trainingOptInAt:
      current.improveModelForEveryone === false && nextImproveModel === true
        ? now
        : patch.trainingOptInAt ?? current.trainingOptInAt,
    trainingOptOutAt:
      current.improveModelForEveryone === true && nextImproveModel === false
        ? now
        : patch.trainingOptOutAt ?? current.trainingOptOutAt,
  };
  const cleaned = sanitizePreferencesInput({
    ...current,
    ...patch,
    ...transitions,
    improveModelForEveryone: nextImproveModel,
    updatedAt: now,
  });
  const payload = {
    userId,
    improveModelForEveryone: String(cleaned.improveModelForEveryone),
    updatedAt: cleaned.updatedAt,
    lastExportAt: cleaned.lastExportAt || "",
    lastArchiveAllAt: cleaned.lastArchiveAllAt || "",
    lastDeleteAllAt: cleaned.lastDeleteAllAt || "",
    trainingOptInAt: cleaned.trainingOptInAt || "",
    trainingOptOutAt: cleaned.trainingOptOutAt || "",
  };

  try {
    const document = await databases.updateDocument(
      databaseId,
      userPreferencesCollectionId,
      userId,
      payload,
      ownerPermissions(userId),
    );
    return serializePreferences(document);
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) {
      throw error;
    }
  }

  const document = await databases.createDocument(
    databaseId,
    userPreferencesCollectionId,
    userId,
    payload,
    ownerPermissions(userId),
  );
  return serializePreferences(document);
}

export function buildMemorySystemPrompt(memory) {
  const lines = [];

  if (memory.displayName) lines.push(`Display name: ${memory.displayName}`);
  if (memory.preferredTone) lines.push(`Preferred tone: ${memory.preferredTone}`);
  if (memory.interests?.length) lines.push(`Interests: ${memory.interests.join(", ")}`);
  if (memory.customInstructions) lines.push(`Custom instructions: ${memory.customInstructions}`);
  if (memory.facts?.length) {
    lines.push("Known user facts:");
    for (const fact of memory.facts) {
      lines.push(`- ${fact}`);
    }
  }

  if (lines.length === 0) {
    return "";
  }

  return [
    "Internal profile memory for the current user.",
    "Use it only when relevant. Do not mention or quote this memory block unless the user asks.",
    ...lines,
  ].join("\n");
}

export async function createConversation(userId, firstMessage = "") {
  const databases = createAdminDatabases();
  const now = new Date().toISOString();
  const title = DEFAULT_CONVERSATION_TITLE;

  return databases.createDocument(
    databaseId,
    conversationsCollectionId,
    ID.unique(),
    {
      userId,
      title,
      createdAt: now,
      updatedAt: now,
      lastMessagePreview: truncate(firstMessage, 120),
      archived: "false",
      archivedAt: "",
    },
    ownerPermissions(userId),
  );
}

async function fetchAllConversations(userId) {
  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, conversationsCollectionId, [
    Query.equal("userId", userId),
    Query.orderDesc("updatedAt"),
    Query.limit(500),
  ]);

  return result.documents.map(serializeConversation);
}

export async function listConversations(userId, options = {}) {
  const archivedFilter =
    typeof options.archived === "boolean" ? options.archived : null;

  const conversations = await fetchAllConversations(userId);
  return conversations.filter((conversation) =>
    archivedFilter === null ? true : conversation.archived === archivedFilter,
  );
}

export async function listConversationsSplit(userId) {
  const conversations = await fetchAllConversations(userId);
  const active = [];
  const archived = [];

  for (const conversation of conversations) {
    if (conversation.archived) {
      archived.push(conversation);
    } else {
      active.push(conversation);
    }
  }

  return { active, archived };
}

export async function getConversation(userId, conversationId) {
  const databases = createAdminDatabases();
  const conversation = await databases.getDocument(
    databaseId,
    conversationsCollectionId,
    conversationId,
  );

  if (conversation.userId !== userId) {
    throw new Error("Conversation not found.");
  }

  const result = await databases.listDocuments(databaseId, messagesCollectionId, [
    Query.equal("userId", userId),
    Query.equal("conversationId", conversationId),
    Query.orderAsc("createdAt"),
    Query.limit(500),
  ]);

  return { conversation: serializeConversation(conversation), messages: result.documents };
}

export async function saveMessage({ userId, conversationId, role, content }) {
  const databases = createAdminDatabases();
  const now = new Date().toISOString();

  return databases.createDocument(
    databaseId,
    messagesCollectionId,
    ID.unique(),
    {
      conversationId,
      userId,
      role,
      content,
      createdAt: now,
    },
    ownerPermissions(userId),
  );
}

export async function updateConversationSummary(conversationId, userId, updates = {}) {
  const databases = createAdminDatabases();
  const payload = {
    updatedAt: new Date().toISOString(),
    ...updates,
  };

  return databases.updateDocument(
    databaseId,
    conversationsCollectionId,
    conversationId,
    payload,
    ownerPermissions(userId),
  );
}

export async function updateConversationArchiveState(userId, conversationId, archived) {
  const databases = createAdminDatabases();
  const conversation = await databases.getDocument(
    databaseId,
    conversationsCollectionId,
    conversationId,
  );

  if (conversation.userId !== userId) {
    throw new Error("Conversation not found.");
  }

  const document = await databases.updateDocument(
    databaseId,
    conversationsCollectionId,
    conversationId,
    {
      archived: archived ? "true" : "false",
      archivedAt: archived ? new Date().toISOString() : "",
      updatedAt: new Date().toISOString(),
    },
    ownerPermissions(userId),
  );

  return serializeConversation(document);
}

export async function archiveAllConversations(userId) {
  const databases = createAdminDatabases();
  const conversations = await listConversations(userId);
  const archivedAt = new Date().toISOString();

  for (const conversation of conversations) {
    if (conversation.archived) {
      continue;
    }

    await databases.updateDocument(
      databaseId,
      conversationsCollectionId,
      conversation.$id,
      {
        archived: "true",
        archivedAt,
        updatedAt: archivedAt,
      },
      ownerPermissions(userId),
    );
  }

  const preferences = await upsertUserPreferences(userId, {
    lastArchiveAllAt: archivedAt,
  });

  return { archivedAt, preferences };
}

export async function deleteAllConversations(userId) {
  const conversations = await listConversations(userId);

  for (const conversation of conversations) {
    await deleteConversation(userId, conversation.$id);
  }

  const deletedAt = new Date().toISOString();
  const preferences = await upsertUserPreferences(userId, {
    lastDeleteAllAt: deletedAt,
  });

  return { deletedAt, preferences };
}

export async function deleteConversation(userId, conversationId) {
  const databases = createAdminDatabases();
  const { messages } = await getConversation(userId, conversationId);

  for (const message of messages) {
    await databases.deleteDocument(databaseId, messagesCollectionId, message.$id);
  }

  await databases.deleteDocument(databaseId, conversationsCollectionId, conversationId);
}

function inferTone(userText) {
  const text = userText.toLowerCase();
  const toneMatches = [
    ["concise", /(?:be|reply|respond|write).{0,20}\bconcise\b/],
    ["friendly", /(?:be|reply|respond|write).{0,20}\bfriendly\b/],
    ["professional", /(?:be|reply|respond|write).{0,20}\bprofessional\b/],
    ["casual", /(?:be|reply|respond|write).{0,20}\bcasual\b/],
    ["formal", /(?:be|reply|respond|write).{0,20}\bformal\b/],
  ];

  for (const [label, pattern] of toneMatches) {
    if (pattern.test(text)) {
      return label;
    }
  }

  return "";
}

function inferDisplayName(userText) {
  const namePatterns = [
    /\bmy name is ([a-z][a-z\s'-]{1,40})/i,
    /\bcall me ([a-z][a-z\s'-]{1,40})/i,
    /\bi am ([a-z][a-z\s'-]{1,40})/i,
  ];

  for (const pattern of namePatterns) {
    const match = userText.match(pattern);
    if (match?.[1]) {
      return truncate(match[1], 40);
    }
  }

  return "";
}

function inferInterests(userText) {
  const matches = [];
  const patterns = [
    /\bi(?:'m| am) interested in ([^.!\n]+)/gi,
    /\bi like ([^.!\n]+)/gi,
    /\bi love ([^.!\n]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(userText)) !== null) {
      matches.push(...String(match[1]).split(/,| and /i));
    }
  }

  return uniqueStrings(matches.map((item) => truncate(item, 60)));
}

function inferFacts(userText) {
  const facts = [];
  const patterns = [
    /\bi work as ([^.!\n]+)/gi,
    /\bi live in ([^.!\n]+)/gi,
    /\bmy favorite ([^.!\n]+)/gi,
    /\bi prefer ([^.!\n]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(userText)) !== null) {
      facts.push(truncate(match[0], 120));
    }
  }

  return uniqueStrings(facts);
}

export async function extractAndPersistMemory(userId, userMessage) {
  const current = await getUserMemory(userId);
  const displayName = inferDisplayName(userMessage) || current.displayName;
  const preferredTone = inferTone(userMessage) || current.preferredTone;
  const interests = uniqueStrings([...(current.interests || []), ...inferInterests(userMessage)]);
  const facts = uniqueStrings([...(current.facts || []), ...inferFacts(userMessage)]);

  return upsertUserMemory(userId, {
    displayName,
    preferredTone,
    interests,
    customInstructions: current.customInstructions,
    facts,
  });
}

export async function searchConversations(userId, query) {
  const term = String(query || "").trim().toLowerCase();
  const conversations = await listConversations(userId);

  if (!term) {
    return conversations.map((conversation) => ({
      conversationId: conversation.$id,
      title: conversation.title,
      snippet: conversation.lastMessagePreview || "",
        updatedAt: conversation.updatedAt,
        type: "conversation",
        archived: conversation.archived,
      }));
  }

  const databases = createAdminDatabases();
  const messagesResult = await databases.listDocuments(databaseId, messagesCollectionId, [
    Query.equal("userId", userId),
    Query.limit(500),
  ]);

  const byId = new Map(conversations.map((conversation) => [conversation.$id, conversation]));
  const results = [];
  const seen = new Set();

  for (const conversation of conversations) {
    const haystack = `${conversation.title} ${conversation.lastMessagePreview || ""}`.toLowerCase();
    if (haystack.includes(term) && !seen.has(conversation.$id)) {
      seen.add(conversation.$id);
      results.push({
        conversationId: conversation.$id,
        title: conversation.title,
        snippet: conversation.lastMessagePreview || "",
        updatedAt: conversation.updatedAt,
        type: "conversation",
        archived: conversation.archived,
      });
    }
  }

  for (const message of messagesResult.documents) {
    if (!String(message.content || "").toLowerCase().includes(term)) {
      continue;
    }

    const conversation = byId.get(message.conversationId);
    if (!conversation || seen.has(conversation.$id)) {
      continue;
    }

    seen.add(conversation.$id);
    results.push({
      conversationId: conversation.$id,
      title: conversation.title,
      snippet: truncate(message.content, 140),
      updatedAt: conversation.updatedAt,
      type: "message",
      role: message.role,
      archived: conversation.archived,
    });
  }

  return results.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

export async function exportUserData(userId) {
  const databases = createAdminDatabases();
  const memory = await getUserMemory(userId);
  const preferences = await getUserPreferences(userId);
  const conversations = await listConversations(userId);
  const messagesResult = await databases.listDocuments(databaseId, messagesCollectionId, [
    Query.equal("userId", userId),
    Query.orderAsc("createdAt"),
    Query.limit(5000),
  ]);
  const messages = messagesResult.documents;
  const messagesByConversationId = new Map();

  for (const message of messages) {
    const items = messagesByConversationId.get(message.conversationId) || [];
    items.push(message);
    messagesByConversationId.set(message.conversationId, items);
  }

  const jsonl = conversations
    .map((conversation) =>
      JSON.stringify({
        category: "conversation_export",
        messages: (messagesByConversationId.get(conversation.$id) || []).map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    )
    .join("\n");

  await upsertUserPreferences(userId, {
    lastExportAt: new Date().toISOString(),
  });

  return {
    jsonl,
    memory,
    preferences,
    conversations,
    messages,
  };
}
