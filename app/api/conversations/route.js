import {
  DEFAULT_CONVERSATION_TITLE,
  createConversation,
  listConversations,
  listConversationsSplit,
  searchConversations,
} from "../../../lib/server/memory";
import { requireUserFromRequest } from "../../../lib/server/appwrite";

export async function GET(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const split = searchParams.get("split") === "true";
    const archivedParam = searchParams.get("archived");
    const archived =
      archivedParam === "true" ? true : archivedParam === "false" ? false : null;

    if (query) {
      const items = await searchConversations(auth.user.$id, query);
      return Response.json({ items });
    }

    if (split) {
      const { active, archived: archivedItems } = await listConversationsSplit(
        auth.user.$id,
      );
      return Response.json({ active, archived: archivedItems });
    }

    const items = await listConversations(
      auth.user.$id,
      archived === null ? {} : { archived },
    );
    return Response.json({ items });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load conversations." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const conversation = await createConversation(
      auth.user.$id,
      body?.title || DEFAULT_CONVERSATION_TITLE,
    );
    return Response.json({ conversation });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to create conversation." },
      { status: 500 },
    );
  }
}
