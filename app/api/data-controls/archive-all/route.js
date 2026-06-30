import { archiveAllConversations } from "../../../../lib/server/memory";
import { requireUserFromRequest } from "../../../../lib/server/appwrite";

export async function POST(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await archiveAllConversations(auth.user.$id);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to archive all chats." },
      { status: 500 },
    );
  }
}
