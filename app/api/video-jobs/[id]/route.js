import { requireUserFromRequest } from "../../../../lib/server/appwrite";
import {
  getImageGenerationJob,
  updateImageGenerationJob,
} from "../../../../lib/server/image-generation-jobs";
import {
  buildConversationTitle,
  extractAndPersistMemory,
  saveMessage,
  updateConversationSummary,
} from "../../../../lib/server/memory";
import {
  backendVideoFileUrl,
  pollBackendVideoJob,
} from "../../../../lib/server/video-generation-flow";

function publicJob(job) {
  const { userId, meta, ...safeJob } = job;
  return safeJob;
}

function normalizeBackendJob(data) {
  const job = data?.job || data || {};
  return {
    status: job.status || data?.status || "processing",
    progress: Number(job.progress ?? data?.progress ?? 0),
    title: job.title || "",
    detail: job.detail || "",
    result: job.result || data?.result || null,
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
      status: "rendering",
      progress,
      title: "Rendering video",
      detail: "Prism is still rendering frames in ComfyUI. Local video renders can take several minutes.",
    };
  }

  if (progress >= 40) {
    return {
      status: "rendering",
      progress,
      title: "Generating video",
      detail: "Prism is rendering frames in ComfyUI.",
    };
  }

  return {
    status: "designing",
    progress,
    title: job.title || "Preparing video",
    detail: job.detail || "Prism is preparing the Wan video workflow.",
  };
}

export async function GET(request, { params }) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const job = await getImageGenerationJob(params.id);
  if (!job) {
    return Response.json({ error: "Video generation job was not found." }, { status: 404 });
  }

  if (job.userId !== auth.user.$id) {
    return Response.json({ error: "Video generation job access denied." }, { status: 403 });
  }

  if (job.status === "completed" || job.status === "failed") {
    return Response.json({ job: publicJob(job) });
  }

  const backendJobId = job.meta?.backendJobId;
  if (!backendJobId) {
    return Response.json({ job: publicJob(job) });
  }

  try {
    const backendJob = normalizeBackendJob(await pollBackendVideoJob(backendJobId));

    if (backendJob.status === "failed") {
      const failedJob = await updateImageGenerationJob(job.id, {
        status: "failed",
        progress: Math.max(Number(job.progress || 0), 95),
        title: "Video generation failed",
        detail: backendJob.error || backendJob.detail || "The video model failed before returning a video.",
        error: backendJob.error || backendJob.detail || "Video generation failed.",
      });
      return Response.json({ job: publicJob(failedJob) });
    }

    if (backendJob.status === "completed" && backendJob.result) {
      const videoUrl = backendVideoFileUrl(backendJobId);
      const prompt = job.meta?.content || job.meta?.prompt || "Generated video";
      const reply = `Generated video:\n\n![nexa-video:${prompt}](${videoUrl})`;
      const savedAssistantMessage = await saveMessage({
        userId: auth.user.$id,
        conversationId: job.conversationId,
        role: "assistant",
        content: reply,
      });
      const resolvedTitle = job.meta?.needsGeneratedTitle
        ? await buildConversationTitle(prompt, "Generated video", "")
        : job.meta?.conversationTitle || "New Conversation";
      const conversation = await updateConversationSummary(job.conversationId, auth.user.$id, {
        title: resolvedTitle,
        lastMessagePreview: `Generated video: ${prompt}`.slice(0, 120),
      });
      const memory = await extractAndPersistMemory(auth.user.$id, prompt).catch(
        () => job.meta?.initialMemory || null,
      );
      const completedJob = await updateImageGenerationJob(job.id, {
        status: "completed",
        progress: 100,
        title: "Video ready",
        detail: "The generated video is ready.",
        meta: null,
        result: {
          reply,
          conversationId: job.conversationId,
          conversation,
          memory,
          assistantMessage: savedAssistantMessage,
          source_confidence: "none",
          used_web_search: false,
          sources: [],
          video: {
            url: videoUrl,
            prompt_used: prompt,
            model: "Prism 0.5",
            backend: "comfyui",
          },
        },
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
      title: "Video generation failed",
      detail: error?.message || "Video generation failed.",
      error: error?.message || "Video generation failed.",
    });
    return Response.json({ job: publicJob(failedJob) });
  }
}
