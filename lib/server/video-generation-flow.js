const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const VIDEO_BACKEND_URL = process.env.NEXA_VIDEO_API_URL || BACKEND_URL;
const DEFAULT_VIDEO_SETTINGS = Object.freeze({
  width: 768,
  height: 432,
  frames: 81,
  fps: 24,
  steps: 40,
  cfg: 5.5,
});

export async function createBackendVideoJob(args) {
  const response = await fetch(`${VIDEO_BACKEND_URL}/v1/video/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: args.prompt,
      raw_user_intent: args.raw_user_intent || args.prompt,
      width: args.width || DEFAULT_VIDEO_SETTINGS.width,
      height: args.height || DEFAULT_VIDEO_SETTINGS.height,
      frames: args.frames || DEFAULT_VIDEO_SETTINGS.frames,
      fps: args.fps || DEFAULT_VIDEO_SETTINGS.fps,
      steps: args.steps || DEFAULT_VIDEO_SETTINGS.steps,
      cfg: args.cfg || DEFAULT_VIDEO_SETTINGS.cfg,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `Video generation is not available at ${VIDEO_BACKEND_URL}. Start the unified C:\\Nexa API and ComfyUI first.`,
      );
    }
    throw new Error((await response.text()) || `Video job creation failed (${response.status}).`);
  }

  const created = await response.json();
  const backendJobId = created?.job?.id || created?.id;
  if (!backendJobId) {
    throw new Error("Video generation job did not return an id.");
  }

  return {
    backendJobId,
    job: created.job || created,
  };
}

export async function pollBackendVideoJob(backendJobId) {
  const response = await fetch(`${VIDEO_BACKEND_URL}/v1/video/jobs/${encodeURIComponent(backendJobId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Video job status failed (${response.status}).`);
  }

  return response.json();
}

export function backendVideoFileUrl(backendJobId) {
  return `${VIDEO_BACKEND_URL}/v1/video/jobs/${encodeURIComponent(backendJobId)}/file`;
}
