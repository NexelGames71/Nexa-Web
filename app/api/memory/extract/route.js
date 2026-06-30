import { extractAndPersistMemory } from "../../../../lib/server/memory";
import { requireUserFromRequest } from "../../../../lib/server/appwrite";

export async function POST(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const memory = await extractAndPersistMemory(auth.user.$id, String(body.userMessage || ""));
    return Response.json({ memory });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to extract memory." },
      { status: 500 },
    );
  }
}
