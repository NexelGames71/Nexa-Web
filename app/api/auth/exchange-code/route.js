import { NextResponse } from "next/server";
import {
  getIdentityBaseUrl,
  getWebBaseUrl,
  NEXA_AUTH_STATE_COOKIE,
  NEXA_WEB_CLIENT_ID,
} from "../../../../lib/server/nexa-identity-flow";

function sanitizeIdentityError(message) {
  if (typeof message !== "string" || !message.trim()) {
    return "Could not complete Nexa Identity sign in.";
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes("prisma.") ||
    normalized.includes("connectorerror") ||
    normalized.includes("prepared statement") ||
    normalized.includes("postgres") ||
    normalized.includes("query execution")
  ) {
    return "Nexa Identity is temporarily unable to complete sign in. Please try again.";
  }

  return message;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const expectedState = request.cookies.get(NEXA_AUTH_STATE_COOKIE)?.value || "";
  if (!body?.code || !body?.state || body.state !== expectedState) {
    return NextResponse.json({ ok: false, error: { message: "Invalid Nexa Identity callback state." } }, { status: 400 });
  }

  const response = await fetch(`${getIdentityBaseUrl()}/v1/auth/exchange-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      code: body.code,
      clientId: NEXA_WEB_CLIENT_ID,
      redirectUri: `${getWebBaseUrl(request)}/auth/callback`,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    return NextResponse.json(
      { ok: false, error: { message: sanitizeIdentityError(payload?.error?.message) } },
      { status: response.status || 401 },
    );
  }

  const nextResponse = NextResponse.json({ ok: true, data: payload.data });
  nextResponse.cookies.delete(NEXA_AUTH_STATE_COOKIE);
  return nextResponse;
}
