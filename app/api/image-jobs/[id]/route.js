import { requireUserFromRequest } from "../../../../lib/server/appwrite";
import {
  getImageGenerationJob,
  updateImageGenerationJob,
} from "../../../../lib/server/image-generation-jobs";
import {
  finalizeGeneratedImageJob,
  normalizeGeneratedImagePayload,
  pollBackendImageJob,
} from "../../../../lib/server/image-generation-flow";

function publicJob(job) {
  const { userId, meta, ...safeJob } = job;
  return safeJob;
}

function normalizeBackendJob(data) {
  const job = data?.job || data || {};
  const resultCandidates = [
    job.result,
    data?.result,
    job.image,
    data?.image,
    job.output,
    data?.output,
    job.payload,
    data?.payload,
  ];
  const result =
    resultCandidates.find((candidate) => {
      const normalized = normalizeGeneratedImagePayload(candidate);
      return normalized.url || normalized.b64;
    }) ||
    job.result ||
    data?.result ||
    null;

  return {
    status: job.status || data?.status || "processing",
    progress: Number(job.progress ?? data?.progress ?? 0),
    result,
    error: job.error || data?.error || "",
  };
}

function statusFrame(job, backendJob) {
  const currentProgress = Number(job.progress || 0);
  const backendProgress = Number(backendJob.progress || 0);
  const progress =
    backendProgress > 0
      ? backendProgress
      : currentProgress < 24
        ? 24
        : currentProgress < 66
          ? 66
          : Math.min(95, currentProgress + 1);

  if (progress >= 80) {
    return {
      status: "finishing",
      progress,
      title: "Finishing image",
      detail: "The model finished rendering. Nexa is saving the image and preparing it for chat.",
    };
  }

  if (progress >= 50) {
    return {
      status: "rendering",
      progress,
      title: "Generating image",
      detail: "Rendering the image now. This can take a moment on the local model.",
    };
  }

  return {
    status: "designing",
    progress,
    title: job.title || "Designing image",
    detail:
      job.detail ||
      "Nexa is planning the image design, detail, style, and aspect ratio.",
  };
}

export async function GET(request, { params }) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const job = await getImageGenerationJob(params.id);
  if (!job) {
    return Response.json({ error: "Image generation job was not found." }, { status: 404 });
  }

  if (job.userId !== auth.user.$id) {
    return Response.json({ error: "Image generation job access denied." }, { status: 403 });
  }

  if (job.status === "completed" || job.status === "failed") {
    return Response.json({ job: publicJob(job) });
  }

  const backendJobId = job.meta?.backendJobId;
  if (!backendJobId) {
    return Response.json({ job: publicJob(job) });
  }

  try {
    const backendJob = normalizeBackendJob(await pollBackendImageJob(backendJobId));

    if (backendJob.status === "failed") {
      const failedJob = await updateImageGenerationJob(job.id, {
        status: "failed",
        progress: Math.max(Number(job.progress || 0), 95),
        title: "Image generation failed",
        detail: backendJob.error || "The image model failed before returning an image.",
        error: backendJob.error || "Image generation failed.",
      });
      return Response.json({ job: publicJob(failedJob) });
    }

    if (backendJob.status === "completed" && backendJob.result) {
      const imagePayload = normalizeGeneratedImagePayload(backendJob.result);
      if (!imagePayload.url && !imagePayload.b64) {
        const failedJob = await updateImageGenerationJob(job.id, {
          status: "failed",
          progress: Math.max(Number(job.progress || 0), 95),
          title: "Image generation failed",
          detail: "The image model finished but did not return a usable image payload.",
          error: "Image generation completed without a URL or base64 image payload.",
        });
        return Response.json({ job: publicJob(failedJob) });
      }
      const finishingJob = await updateImageGenerationJob(job.id, {
        status: "finishing",
        progress: 96,
        title: "Finishing image",
        detail: "Saving the generated image and preparing it for the chat.",
      });
      const result = await finalizeGeneratedImageJob({
        job: finishingJob,
        imagePayload,
      });
      const completedJob = await updateImageGenerationJob(job.id, {
        status: "completed",
        progress: 100,
        title: "Image ready",
        detail: "The generated image is ready.",
        meta: null,
        result,
      });
      return Response.json({ job: publicJob(completedJob) });
    }

    const updatedJob = await updateImageGenerationJob(job.id, {
      ...statusFrame(job, backendJob),
    });
    return Response.json({ job: publicJob(updatedJob) });
  } catch (error) {
    const failedJob = await updateImageGenerationJob(job.id, {
      status: "failed",
      progress: Math.max(Number(job.progress || 0), 95),
      title: "Image generation failed",
      detail: error?.message || "Image generation failed.",
      error: error?.message || "Image generation failed.",
    });
    return Response.json({ job: publicJob(failedJob) });
  }
}
