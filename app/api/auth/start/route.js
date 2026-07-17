import { NextResponse } from "next/server";
import {
  createAuthState,
  createIdentityStartUrl,
  NEXA_AUTH_STATE_COOKIE,
} from "../../../../lib/server/nexa-identity-flow";

const validModes = new Set(["login", "signup", "forgot-password"]);

export async function GET(request) {
  const url = new URL(request.url);
  const mode = validModes.has(url.searchParams.get("mode")) ? url.searchParams.get("mode") : "login";
  const state = createAuthState();
  const response = NextResponse.redirect(createIdentityStartUrl(request, mode, state));
  response.cookies.set(NEXA_AUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
