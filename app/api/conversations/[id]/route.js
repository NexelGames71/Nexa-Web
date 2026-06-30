import {
  DEFAULT_CONVERSATION_TITLE,
  deleteConversation,
  getConversation,
  updateConversationArchiveState,
  updateConversationSummary,
} from "../../../../lib/server/memory";
import { requireUserFromRequest } from "../../../../lib/server/appwrite";

export async function GET(request, { params }) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await getConversation(auth.user.$id, params.id);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load conversation." },
      { status: 404 },
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteConversation(auth.user.$id, params.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to delete conversation." },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    let conversation = null;

    if (typeof body?.title === "string") {
      const title = body.title.trim() || DEFAULT_CONVERSATION_TITLE;
      const document = await updateConversationSummary(params.id, auth.user.$id, { title });
      conversation = {
        id: document.$id,
        title: document.title,
        updatedAt: document.updatedAt || document.$updatedAt,
        lastMessagePreview: document.lastMessagePreview || "",
        archived: String(document.archived || "").toLowerCase() === "true",
        archivedAt: document.archivedAt || "",
      };
    }

    const archivedFlag =
      body?.archived === true || body?.archived === "true"
        ? true
        : body?.archived === false || body?.archived === "false"
          ? false
          : null;

    if (archivedFlag !== null) {
      conversation = await updateConversationArchiveState(
        auth.user.$id,
        params.id,
        archivedFlag,
      );
    }

    if (!conversation) {
      return Response.json({ error: "No valid fields to update." }, { status: 400 });
    }

    return Response.json({ conversation });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to update conversation." },
      { status: 500 },
    );
  }
}
