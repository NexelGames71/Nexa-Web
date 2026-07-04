"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { account, appwriteConfigured, isAdminEmail } from "../../lib/appwrite";

type AuthUser = {
  $id: string;
  name?: string;
  email: string;
  planId?: string;
  planName?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!appwriteConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const current = await account.get();
      let billingProfile: any = null;
      try {
        const jwt = await account.createJWT();
        const response = await fetch("/api/billing/me", {
          headers: {
            Authorization: `Bearer ${jwt.jwt}`,
          },
          cache: "no-store",
        });
        if (response.ok) {
          billingProfile = await response.json();
        }
      } catch {}

      setUser({
        $id: current.$id,
        name: current.name,
        email: current.email,
        planId: billingProfile?.plan || "starter",
        planName: billingProfile?.planName || "Starter",
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession("current");
    } catch {}

    setUser(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nexa-auth-changed"));
    }
  }, []);

  useEffect(() => {
    refresh();

    function handleAuthChange() {
      void refresh();
    }

    function handleFocus() {
      void refresh();
    }

    window.addEventListener("nexa-auth-changed", handleAuthChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    });

    return () => {
      window.removeEventListener("nexa-auth-changed", handleAuthChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: isAdminEmail(user?.email),
      refresh,
      signOut,
    }),
    [user, loading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("nexa-auth-changed"));
  }
}
