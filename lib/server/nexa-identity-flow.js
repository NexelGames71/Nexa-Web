import { randomBytes } from "node:crypto";

export const NEXA_AUTH_STATE_COOKIE = "nexa_auth_state";
export const NEXA_WEB_CLIENT_ID = process.env.NEXA_WEB_CLIENT_ID || "nexa-web";

function defaultIdentityBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? "https://identity.trynexa-ai.com"
    : "http://127.0.0.1:4000";
}

export function getIdentityBaseUrl() {
  return (
    process.env.NEXA_IDENTITY_URL ||
    process.env.NEXT_PUBLIC_NEXA_IDENTITY_URL ||
    process.env.NEXT_PUBLIC_IDENTITY_URL ||
    defaultIdentityBaseUrl()
  ).replace(/\/$/, "");
}

export function getWebBaseUrl(request) {
  const configured = process.env.NEXA_WEB_URL || process.env.NEXT_PUBLIC_NEXA_WEB_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  const url = new URL(request.url);
  return url.origin;
}

export function safeReturnTo(request, value) {
  const baseUrl = getWebBaseUrl(request);
  if (!value) {
    return `${baseUrl}/chat`;
  }
  try {
    const candidate = new URL(value, baseUrl);
    if (candidate.origin !== new URL(baseUrl).origin) {
      return `${baseUrl}/chat`;
    }
    return candidate.toString();
  } catch {
    return `${baseUrl}/chat`;
  }
}

export function createAuthState() {
  return randomBytes(24).toString("base64url");
}

export function createIdentityStartUrl(request, mode, state) {
  const url = new URL(request.url);
  const webBaseUrl = getWebBaseUrl(request);
  const identityUrl = new URL(`/${mode}`, getIdentityBaseUrl());
  identityUrl.searchParams.set("client_id", NEXA_WEB_CLIENT_ID);
  identityUrl.searchParams.set("redirect_uri", `${webBaseUrl}/auth/callback`);
  identityUrl.searchParams.set("return_to", safeReturnTo(request, url.searchParams.get("next") || url.searchParams.get("return_to")));
  identityUrl.searchParams.set("state", state);
  return identityUrl;
}
