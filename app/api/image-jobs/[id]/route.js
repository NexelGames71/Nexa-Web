import { requireUserFromRequest } from "../../../../lib/server/appwrite";
import { getImageGenerationJob } from "../../../../lib/server/image-generation-jobs";

export async function GET(request, { params }) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const job = getImageGenerationJob(params.id);
  if (!job) {
    return Response.json({ error: "Image generation job was not found." }, { status: 404 });
  }

  if (job.userId !== auth.user.$id) {
    return Response.json({ error: "Image generation job access denied." }, { status: 403 });
  }

  const { userId, ...publicJob } = job;
  return Response.json({ job: publicJob });
}
