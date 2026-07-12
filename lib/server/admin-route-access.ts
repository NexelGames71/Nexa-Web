import { headers } from "next/headers";

function splitCsv(value?: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const DEFAULT_ADMIN_HOSTS = ["trynexa-ai.com", "www.trynexa-ai.com"];

export function isAdminRouteEnabled() {
  const enabled = process.env.NEXA_ENABLE_ADMIN === "true";
  if (enabled) {
    return true;
  }

  const host = (headers().get("host") || "").toLowerCase();
  const configuredHosts = splitCsv(process.env.NEXA_ADMIN_HOSTS);
  const allowedHosts = configuredHosts.length > 0 ? configuredHosts : DEFAULT_ADMIN_HOSTS;
  if (allowedHosts.includes(host)) {
    return true;
  }

  const isLocalHost =
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.startsWith("[::1]:");

  return process.env.NODE_ENV !== "production" && isLocalHost;
}
