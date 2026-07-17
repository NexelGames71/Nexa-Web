import { getIdentityBaseUrl } from "./nexa-identity-flow";

export function identityOwnedPayPalStatus(overrides = {}) {
  return {
    provider: "identity",
    configured: false,
    checkoutEnabled: false,
    environment: "unknown",
    productId: "",
    productName: "",
    configuredPlanCount: 0,
    missingConfiguration: ["Nexa Identity billing readiness unavailable"],
    managedBy: "Nexa Identity",
    ...overrides,
  };
}

export async function getIdentityPayPalStatus() {
  try {
    const response = await fetch(`${getIdentityBaseUrl()}/v1/billing/readiness`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    const data = payload?.data || payload;

    if (!response.ok || payload?.ok === false) {
      return identityOwnedPayPalStatus({
        missingConfiguration: [payload?.error?.message || "Nexa Identity billing readiness request failed"],
      });
    }

    return identityOwnedPayPalStatus({
      provider: data?.provider || "identity",
      configured: Boolean(data?.checkoutEnabled),
      checkoutEnabled: Boolean(data?.checkoutEnabled),
      environment: data?.paypal?.environment || "unknown",
      productId: data?.paypal?.productId || "",
      productName: data?.paypal?.productName || "",
      configuredPlanCount: Number(data?.paypal?.configuredPlanCount || 0),
      missingConfiguration: data?.missingConfiguration || [],
    });
  } catch (error) {
    return identityOwnedPayPalStatus({
      missingConfiguration: [error?.message || "Nexa Identity billing readiness is unreachable"],
    });
  }
}
