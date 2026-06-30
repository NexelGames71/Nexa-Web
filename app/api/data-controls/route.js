import {
  getUserPreferences,
  listConversationsSplit,
  upsertUserPreferences,
} from "../../../lib/server/memory";
import { requireUserFromRequest } from "../../../lib/server/appwrite";

export async function GET(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [preferences, conversationLists] = await Promise.all([
      getUserPreferences(auth.user.$id),
      listConversationsSplit(auth.user.$id),
    ]);

    return Response.json({
      preferences,
      counts: {
        active: conversationLists.active.length,
        archived: conversationLists.archived.length,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load data controls." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const preferences = await upsertUserPreferences(auth.user.$id, {
      improveModelForEveryone: Boolean(body?.improveModelForEveryone),
    });
    return Response.json({ preferences });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to update data controls." },
      { status: 500 },
    );
  }
}
