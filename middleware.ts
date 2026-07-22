import { NextRequest, NextResponse } from "next/server";
import { getConfiguredMaintenanceUntil } from "./lib/maintenance-window";

const MAINTENANCE_PATH = "/maintenance";
const MAINTENANCE_UNTIL = getConfiguredMaintenanceUntil();

function getMaintenanceEndTime() {
  if (!MAINTENANCE_UNTIL) {
    return null;
  }

  const endTime = Date.parse(MAINTENANCE_UNTIL);
  return Number.isNaN(endTime) ? null : endTime;
}

function isMaintenanceActive() {
  const endTime = getMaintenanceEndTime();
  return endTime !== null && Date.now() < endTime;
}

export function middleware(request: NextRequest) {
  if (!isMaintenanceActive()) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === MAINTENANCE_PATH) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = MAINTENANCE_PATH;
  url.searchParams.set("until", MAINTENANCE_UNTIL);

  const response = NextResponse.rewrite(url);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Nexa-Maintenance", "active");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
