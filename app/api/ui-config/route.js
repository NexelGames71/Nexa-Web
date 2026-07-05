const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const UI_CONFIG_TIMEOUT_MS = Number(process.env.BACKEND_UI_CONFIG_TIMEOUT_MS || 5000);

async function fetchWithTimeout(url, options = {}, timeoutMs = UI_CONFIG_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  let response;

  try {
    response = await fetchWithTimeout(`${BACKEND_URL}/ui-config`, {
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return Response.json(
      {
        error: timedOut
          ? `Nexa backend did not respond to /ui-config within ${Math.round(UI_CONFIG_TIMEOUT_MS / 1000)} seconds.`
          : error?.message || "Failed to load Nexa backend UI config.",
      },
      { status: 504 },
    );
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
    },
  });
}
