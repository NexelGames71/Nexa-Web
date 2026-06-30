import { requireAdminFromRequest } from "../../../../../lib/server/appwrite";
import { runScheduledTrainingExport } from "../../../../../lib/server/training";

const cronSecret = process.env.TRAINING_EXPORT_CRON_SECRET || "";

function hasValidCronSecret(request) {
  const value = request.headers.get("x-training-cron-secret") || "";
  return Boolean(cronSecret) && value === cronSecret;
}

export async function POST(request) {
  if (!hasValidCronSecret(request)) {
    const auth = await requireAdminFromRequest(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
  }

  try {
    const exportJob = await runScheduledTrainingExport();
    return Response.json({ export: exportJob });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to run scheduled training export." },
      { status: 500 },
    );
  }
}
