import { Query } from "node-appwrite";

import {
  createAdminUsers,
  createAdminDatabases,
  databaseId,
  requireAdminFromRequest,
  userPreferencesCollectionId,
} from "../../../../lib/server/appwrite";

const PAGE_SIZE = 100;
const MAX_USERS = 500;
const PREFERENCE_BATCH_SIZE = 25;

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  status: number;
  emailVerification: boolean;
  phoneVerification: boolean;
  labels: string[];
  registration?: string;
  lastLogin?: string;
  prefs: {
    improveModelForEveryone: boolean;
    trainingOptInAt: string | null;
    trainingOptOutAt: string | null;
    updatedAt: string | null;
  };
};

function includesSearch(user: any, term: string) {
  if (!term) {
    return true;
  }

  const haystack = [user.name, user.email, user.labels?.join(" ")]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return haystack.includes(term);
}

function cleanPreference(document: any) {
  if (!document) {
    return {
      improveModelForEveryone: false,
      trainingOptInAt: null,
      trainingOptOutAt: null,
      updatedAt: null,
    };
  }

  const toBool = (value: unknown) => String(value || "").toLowerCase() === "true";

  return {
    improveModelForEveryone: toBool(document.improveModelForEveryone),
    trainingOptInAt: document.trainingOptInAt || null,
    trainingOptOutAt: document.trainingOptOutAt || null,
    updatedAt: document.updatedAt || document.$updatedAt || null,
  };
}

function mapUser(user: any, prefs: any): AdminUserSummary {
  return {
    id: user.$id,
    name: user.name || "—",
    email: user.email || "",
    status: Number(user.status || 0),
    emailVerification: Boolean(user.emailVerification),
    phoneVerification: Boolean(user.phoneVerification),
    labels: Array.isArray(user.labels) ? user.labels : [],
    registration: user.registration || user.$createdAt || null,
    lastLogin: user.lastLogin || null,
    prefs: cleanPreference(prefs),
  };
}

async function fetchAllUsers() {
  const client = createAdminUsers();
  const items: any[] = [];
  let cursor = "";

  while (items.length < MAX_USERS) {
    const queries = [Query.limit(PAGE_SIZE)];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const result = await client.list(queries);
    const batch = Array.isArray(result?.users) ? result.users : [];
    if (batch.length === 0) {
      break;
    }

    items.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return items;
}

async function fetchPreferencesForUsers(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, any>();
  }

  const databases = createAdminDatabases();
  const preferences = new Map<string, any>();

  for (let index = 0; index < userIds.length; index += PREFERENCE_BATCH_SIZE) {
    const batch = userIds.slice(index, index + PREFERENCE_BATCH_SIZE);
    const result = await databases.listDocuments(databaseId, userPreferencesCollectionId, [
      Query.equal("userId", batch),
      Query.limit(PREFERENCE_BATCH_SIZE),
    ]);

    for (const document of result.documents || []) {
      preferences.set(document.userId || document.$id, document);
    }
  }

  return preferences;
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("search")?.trim().toLowerCase() ?? "";

  try {
    const rawUsers = await fetchAllUsers();
    const filteredRawUsers = searchTerm
      ? rawUsers.filter((user) => includesSearch(user, searchTerm))
      : rawUsers;
    const preferenceMap = await fetchPreferencesForUsers(filteredRawUsers.map((user) => user.$id));
    const items = filteredRawUsers.map((user) => mapUser(user, preferenceMap.get(user.$id)));

    return Response.json({
      items,
      meta: {
        totalFetched: rawUsers.length,
        totalInView: items.length,
        truncated: rawUsers.length >= MAX_USERS,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load admin users." },
      { status: 500 },
    );
  }
}
