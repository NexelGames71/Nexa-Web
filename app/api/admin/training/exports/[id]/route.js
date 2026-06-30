import { requireAdminFromRequest } from "../../../../../../lib/server/appwrite";
import { getTrainingExportById } from "../../../../../../lib/server/training";

export async function GET(request, { params }) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const item = await getTrainingExportById(params.id);
    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load training export." },
      { status: 500 },
    );
  }
}
