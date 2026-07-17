const identityUrl = (
  process.env.NEXT_PUBLIC_NEXA_IDENTITY_URL ||
  process.env.NEXT_PUBLIC_IDENTITY_URL ||
  "http://127.0.0.1:4000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "nexa_identity_access_token";
const REFRESH_TOKEN_KEY = "nexa_identity_refresh_token";

export const authConfigured = Boolean(identityUrl);
export const identityConfigured = authConfigured;
export const appwriteConfigured = authConfigured;

export const ID = {
  unique() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `nexa_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  },
};

export function getStoredIdentityToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setIdentityTokens(tokens = {}) {
  if (typeof window === "undefined") {
    return;
  }
  if (tokens.accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  }
  if (tokens.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

function getStoredToken(key) {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(key) || "";
}

function setStoredToken(key, value) {
  if (typeof window === "undefined") {
    return;
  }
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
}

function toNexaUser(identityUser) {
  const name =
    identityUser?.displayName ||
    [identityUser?.firstName, identityUser?.lastName].filter(Boolean).join(" ") ||
    identityUser?.username ||
    "";

  return {
    ...identityUser,
    $id: identityUser?.id,
    name,
    email: identityUser?.email || "",
  };
}

async function identityRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getStoredToken(ACCESS_TOKEN_KEY);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${identityUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error?.message || payload?.message || "Nexa Identity request failed.");
  }

  return payload?.data ?? payload;
}

async function refreshIdentitySession() {
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("No Nexa Identity refresh token is available.");
  }

  const data = await identityRequest("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  const tokens = data?.tokens || data;
  setIdentityTokens(tokens);
  return tokens.accessToken;
}

export const account = {
  async create(_id, email, password, name) {
    const username = String(email || "").split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 32);
    const data = await identityRequest("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        username: username.length >= 3 ? username : `user${Date.now()}`,
        displayName: name || username || email,
      }),
    });
    return toNexaUser(data.user);
  },

  async createEmailPasswordSession(email, password) {
    const data = await identityRequest("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: email,
        password,
        deviceName: "Nexa Web",
        deviceType: "browser",
        platform: typeof navigator !== "undefined" ? navigator.platform : "web",
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "web",
      }),
    });
    setIdentityTokens(data.tokens);
    return { userId: data.user?.id, expire: data.tokens.refreshTokenExpiresAt };
  },

  async get() {
    try {
      const data = await identityRequest("/v1/auth/me");
      return toNexaUser(data.user);
    } catch (error) {
      try {
        await refreshIdentitySession();
        const data = await identityRequest("/v1/auth/me");
        return toNexaUser(data.user);
      } catch {
        throw error;
      }
    }
  },

  async createJWT() {
    const token = getStoredToken(ACCESS_TOKEN_KEY) || (await refreshIdentitySession());
    return { jwt: token };
  },

  async deleteSession(_sessionId = "current") {
    const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await identityRequest("/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      } catch {}
    }
    setStoredToken(ACCESS_TOKEN_KEY, "");
    setStoredToken(REFRESH_TOKEN_KEY, "");
  },
};

export function isAdminEmail(email) {
  const [localPart] = String(email || "").trim().toLowerCase().split("@");
  return localPart.startsWith("admin.");
}

export async function createSessionJwt() {
  const jwt = await account.createJWT();
  return jwt.jwt;
}
