import { requireAdminFromRequest } from "../../../../../../../lib/server/appwrite";
import { getTrainingExportDownloadLinks } from "../../../../../../../lib/server/training";

export async function POST(request, { params }) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const download = await getTrainingExportDownloadLinks(params.id);
    return Response.json(download);
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to prepare download links." },
      { status: 500 },
    );
  }
}
