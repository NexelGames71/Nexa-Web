import { Query } from "node-appwrite";

import {
  conversationsCollectionId,
  createAdminDatabases,
  createAdminUsers,
  databaseId,
  messagesCollectionId,
  requireAdminFromRequest,
} from "../../../../lib/server/appwrite";

const COLLECTION_PAGE_SIZE = 100;
const MAX_COLLECTION_RECORDS = 1000;
const DAILY_TREND_DAYS = 7;
const HOURLY_BUCKETS = 24;

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDocumentDate(document: Record<string, any>, primaryKey = "updatedAt") {
  return (
    parseDate(document[primaryKey]) ||
    parseDate(document.createdAt) ||
    parseDate(document.$createdAt) ||
    parseDate(document.$updatedAt)
  );
}

async function fetchCollection(collectionId: string, maxRecords = MAX_COLLECTION_RECORDS) {
  const databases = createAdminDatabases();
  const documents: Record<string, any>[] = [];
  let cursor = "";

  while (documents.length < maxRecords) {
    const limit = Math.min(COLLECTION_PAGE_SIZE, maxRecords - documents.length);
    const queries = [Query.limit(limit)];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const result = await databases.listDocuments(databaseId, collectionId, queries);
    const batch = Array.isArray(result.documents) ? result.documents : [];
    if (batch.length === 0) {
      break;
    }

    documents.push(...batch);

    if (batch.length < limit) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return documents;
}

async function fetchAllUsers() {
  const users = createAdminUsers();
  const items: any[] = [];
  let cursor = "";

  while (items.length < MAX_COLLECTION_RECORDS) {
    const limit = Math.min(COLLECTION_PAGE_SIZE, MAX_COLLECTION_RECORDS - items.length);
    const queries = [Query.limit(limit)];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const result = await users.list(queries);
    const batch = Array.isArray(result?.users) ? result.users : [];
    if (batch.length === 0) {
      break;
    }

    items.push(...batch);

    if (batch.length < limit) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return items;
}

function buildDateBuckets(days: number) {
  const buckets: { key: string; label: string; date: Date }[] = [];
  const now = new Date();
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    buckets.push({ key, label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), date });
  }
  return buckets;
}

function buildDailyCounts<T>(items: T[], getDate: (item: T) => Date | null, getValue?: (item: T) => number) {
  const buckets = buildDateBuckets(DAILY_TREND_DAYS);
  const counts = new Map<string, number>();

  for (const bucket of buckets) {
    counts.set(bucket.key, 0);
  }

  for (const item of items) {
    const date = getDate(item);
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    if (!counts.has(key)) continue;
    const current = counts.get(key) ?? 0;
    counts.set(key, current + (getValue ? getValue(item) : 1));
  }

  return buckets.map((bucket) => ({ date: bucket.key, label: bucket.label, count: counts.get(bucket.key) ?? 0 }));
}

function buildDailyActiveUsers(messages: Record<string, any>[]) {
  const buckets = buildDateBuckets(DAILY_TREND_DAYS);
  const sets = new Map<string, Set<string>>();
  for (const bucket of buckets) {
    sets.set(bucket.key, new Set());
  }

  for (const message of messages) {
    const date = getDocumentDate(message, "createdAt");
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    const userId = String(message.userId || "").trim();
    if (!userId || !sets.has(key)) continue;
    sets.get(key)!.add(userId);
  }

  return buckets.map((bucket) => ({ date: bucket.key, label: bucket.label, count: sets.get(bucket.key)?.size ?? 0 }));
}

function buildHourlySeries(messages: Record<string, any>[]) {
  const now = new Date();
  const buckets: { key: string; label: string; start: Date }[] = [];
  for (let index = HOURLY_BUCKETS - 1; index >= 0; index -= 1) {
    const start = new Date(now.getTime() - index * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const key = start.toISOString().slice(0, 13);
    const label = start.toLocaleTimeString(undefined, { hour: "numeric" });
    buckets.push({ key, label, start });
  }

  const counts = new Map<string, number>();
  for (const bucket of buckets) {
    counts.set(bucket.key, 0);
  }

  for (const message of messages) {
    const createdAt = getDocumentDate(message, "createdAt");
    if (!createdAt) continue;
    const key = createdAt.toISOString().slice(0, 13);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return buckets.map((bucket) => ({ hour: bucket.key, label: bucket.label, count: counts.get(bucket.key) ?? 0 }));
}

function summarizeTopUsers(users: any[], conversations: Record<string, any>[], messages: Record<string, any>[]) {
  const index = new Map<string, any>();
  const stats = new Map<string, { id: string; messageCount: number; conversationCount: number; lastActiveAt: string }>();

  for (const user of users) {
    index.set(user.$id, user);
  }

  for (const conversation of conversations) {
    const userId = String(conversation.userId || "").trim();
    if (!userId) continue;
    if (!stats.has(userId)) {
      stats.set(userId, {
        id: userId,
        messageCount: 0,
        conversationCount: 0,
        lastActiveAt: "",
      });
    }
    const entry = stats.get(userId)!;
    entry.conversationCount += 1;
    const updatedAt = getDocumentDate(conversation, "updatedAt");
    if (updatedAt && (!entry.lastActiveAt || updatedAt.toISOString() > entry.lastActiveAt)) {
      entry.lastActiveAt = updatedAt.toISOString();
    }
  }

  for (const message of messages) {
    const userId = String(message.userId || "").trim();
    if (!userId) continue;
    if (!stats.has(userId)) {
      stats.set(userId, {
        id: userId,
        messageCount: 0,
        conversationCount: 0,
        lastActiveAt: "",
      });
    }
    const entry = stats.get(userId)!;
    entry.messageCount += 1;
    const createdAt = getDocumentDate(message, "createdAt");
    if (createdAt && (!entry.lastActiveAt || createdAt.toISOString() > entry.lastActiveAt)) {
      entry.lastActiveAt = createdAt.toISOString();
    }
  }

  const rows = Array.from(stats.values())
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5)
    .map((row) => {
      const user = index.get(row.id) || {};
      return {
        id: row.id,
        name: user.name || "—",
        email: user.email || "",
        messageCount: row.messageCount,
        conversationCount: row.conversationCount,
        lastActiveAt: row.lastActiveAt,
      };
    });

  return rows;
}

function summarizeRecentConversations(conversations: Record<string, any>[]) {
  return conversations
    .map((conversation) => ({
      id: conversation.$id,
      title: conversation.title || "Untitled session",
      userId: conversation.userId,
      lastMessagePreview: conversation.lastMessagePreview || "",
      updatedAt:
        getDocumentDate(conversation, "updatedAt")?.toISOString() || conversation.updatedAt || conversation.$updatedAt || "",
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [users, conversations, messages] = await Promise.all([
      fetchAllUsers(),
      fetchCollection(conversationsCollectionId),
      fetchCollection(messagesCollectionId),
    ]);

    const totalUsers = users.length;
    const totalConversations = conversations.length;
    const totalMessages = messages.length;
    const avgMessagesPerConversation = totalConversations
      ? Number((totalMessages / totalConversations).toFixed(1))
      : 0;

    const now = Date.now();
    const active24h = new Set<string>();
    const weeklyActive = new Set<string>();
    const cutoff24h = now - 24 * 60 * 60 * 1000;
    const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;

    for (const message of messages) {
      const createdAt = getDocumentDate(message, "createdAt");
      if (!createdAt) continue;
      const timestamp = createdAt.getTime();
      const userId = String(message.userId || "").trim();
      if (!userId) continue;
      if (timestamp >= cutoff24h) {
        active24h.add(userId);
      }
      if (timestamp >= cutoff7d) {
        weeklyActive.add(userId);
      }
    }

    const conversationSeries = buildDailyCounts(conversations, (conversation) =>
      getDocumentDate(conversation, "createdAt") || getDocumentDate(conversation, "updatedAt"),
    );
    const messageSeries = buildDailyCounts(messages, (message) => getDocumentDate(message, "createdAt"));
    const activeSeries = buildDailyActiveUsers(messages);
    const hourlyMessages = buildHourlySeries(messages);
    const topUsers = summarizeTopUsers(users, conversations, messages);
    const recentConversations = summarizeRecentConversations(conversations);

    return Response.json({
      metrics: {
        totalUsers,
        totalConversations,
        totalMessages,
        avgMessagesPerConversation,
        activeUsers24h: active24h.size,
        weeklyActiveUsers: weeklyActive.size,
      },
      daily: {
        conversations: conversationSeries,
        messages: messageSeries,
        activeUsers: activeSeries,
      },
      hourlyMessages,
      topUsers,
      recentConversations,
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load analytics." },
      { status: 500 },
    );
  }
}
