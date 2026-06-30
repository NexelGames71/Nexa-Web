import { requireAdminFromRequest } from "../../../../../lib/server/appwrite";
import { listTrainingExports, runTrainingExportJob } from "../../../../../lib/server/training";

export async function GET(request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const items = await listTrainingExports();
    return Response.json({ items });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load training exports." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const exportJob = await runTrainingExportJob({
      scope: body?.scope,
      mode: "manual",
    });
    return Response.json({ export: exportJob });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to run training export." },
      { status: 500 },
    );
  }
}
