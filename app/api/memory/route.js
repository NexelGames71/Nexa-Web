import { getUserMemory, upsertUserMemory } from "../../../lib/server/memory";
import { requireUserFromRequest } from "../../../lib/server/appwrite";

export async function GET(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const memory = await getUserMemory(auth.user.$id);
    return Response.json({ memory });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load memory." },
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
    const body = await request.json();
    const memory = await upsertUserMemory(auth.user.$id, body);
    return Response.json({ memory });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to save memory." },
      { status: 500 },
    );
  }
}
