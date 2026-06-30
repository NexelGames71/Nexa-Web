import { requireAdminFromRequest } from "../../../../../lib/server/appwrite";
import { getTrainingOverview } from "../../../../../lib/server/training";

export async function GET(request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const overview = await getTrainingOverview();
    return Response.json({ overview });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load training overview." },
      { status: 500 },
    );
  }
}
