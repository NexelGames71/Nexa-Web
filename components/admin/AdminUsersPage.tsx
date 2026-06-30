"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { account, appwriteConfigured, createSessionJwt } from "../../lib/appwrite";
import AdminMetricCard from "./AdminMetricCard";
import AdminPageHeader from "./AdminPageHeader";
import AdminPanel from "./AdminPanel";

type TrainingPreference = {
  improveModelForEveryone: boolean;
  trainingOptInAt: string | null;
  trainingOptOutAt: string | null;
  updatedAt: string | null;
};

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  status: number;
  emailVerification: boolean;
  phoneVerification: boolean;
  labels: string[];
  registration?: string | null;
  lastLogin?: string | null;
  prefs: TrainingPreference;
};

const STATUS_META: Record<"active" | "invited" | "blocked" | "unknown", {
  label: string;
  className: string;
}> = {
  active: {
    label: "Active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  invited: {
    label: "Invited",
    className: "border-sky-200 bg-sky-50 text-sky-900",
  },
  blocked: {
    label: "Blocked",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  unknown: {
    label: "Unknown",
    className: "border-line bg-sidebar text-muted",
  },
};

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "blocked", label: "Blocked" },
];

const CONSENT_FILTERS = [
  { value: "all", label: "Any consent" },
  { value: "opted-in", label: "Opted in" },
  { value: "opted-out", label: "Opted out" },
];

function getStatusKey(status: number): keyof typeof STATUS_META {
  if (status === 1) return "active";
  if (status === 0) return "invited";
  if (status >= 2) return "blocked";
  return "unknown";
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours || 1}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

function ConsentPill({ optedIn }: { optedIn: boolean }) {
  const className = optedIn
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-line bg-sidebar text-muted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {optedIn ? "Opted in" : "Opted out"}
    </span>
  );
}

function StatusPill({ status }: { status: number }) {
  const key = getStatusKey(status);
  const { label, className } = STATUS_META[key];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {label}
    </span>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [meta, setMeta] = useState<{ totalFetched: number; totalInView: number; truncated: boolean }>(
    { totalFetched: 0, totalInView: 0, truncated: false },
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [consentFilter, setConsentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function getValidAuthToken(forceRefresh = false) {
    if (!forceRefresh && authToken) {
      return authToken;
    }

    const jwt = await createSessionJwt();
    setAuthToken(jwt);
    return jwt;
  }

  async function authorizedFetch(path: string, options: RequestInit = {}, tokenOverride = "") {
    const jwt = tokenOverride || (await getValidAuthToken());
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${jwt}`);

    let response = await fetch(path, { ...options, headers });

    if (response.status === 401 && !tokenOverride) {
      const refreshedJwt = await getValidAuthToken(true);
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${refreshedJwt}`);
      response = await fetch(path, { ...options, headers: retryHeaders });
    }

    return response;
  }

  async function loadUsers(tokenOverride = "", { initial = false } = {}) {
    if (!initial) {
      setRefreshing(true);
    }
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/admin/users", {}, tokenOverride);
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403) {
        throw new Error("Admin access required.");
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to load admin users.");
      }

      const items = Array.isArray(data.items) ? data.items : [];
      setUsers(items);
      setMeta({
        totalFetched: Number(data.meta?.totalFetched || items.length),
        totalInView: Number(data.meta?.totalInView || items.length),
        truncated: Boolean(data.meta?.truncated),
      });
      setSelectedUserId((current) => {
        if (current && items.some((user) => user.id === current)) {
          return current;
        }
        return items[0]?.id || "";
      });
    } catch (error: any) {
      setLoadError(error?.message || "Failed to load admin users.");
    } finally {
      if (!initial) {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    async function initialize() {
      if (!appwriteConfigured) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      try {
        const user = await account.get();
        setCurrentAdminEmail(user.email);
        const jwt = await createSessionJwt();
        setAuthToken(jwt);
        await loadUsers(jwt, { initial: true });
      } catch (error: any) {
        if (error?.code === 401) {
          router.replace("/login");
          return;
        }
        setLoadError(error?.message || "Failed to load admin route.");
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [router]);

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return users.filter((user) => {
      if (searchTerm) {
        const haystack = [user.name, user.email, user.labels.join(" ")]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      if (statusFilter !== "all") {
        const key = getStatusKey(user.status);
        if (key !== statusFilter) {
          return false;
        }
      }

      if (consentFilter === "opted-in" && !user.prefs.improveModelForEveryone) {
        return false;
      }
      if (consentFilter === "opted-out" && user.prefs.improveModelForEveryone) {
        return false;
      }

      return true;
    });
  }, [users, search, statusFilter, consentFilter]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUserId("");
      return;
    }

    if (!filteredUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const totalUsers = meta.totalFetched || users.length;
  const optedInCount = useMemo(
    () => users.filter((user) => user.prefs.improveModelForEveryone).length,
    [users],
  );
  const blockedCount = useMemo(
    () => users.filter((user) => getStatusKey(user.status) === "blocked").length,
    [users],
  );
  const emailVerifiedCount = useMemo(
    () => users.filter((user) => user.emailVerification).length,
    [users],
  );

  const loadingState = loading && !refreshing;

  if (loadingState) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="rounded-3xl border border-line bg-panel px-6 py-5 text-sm text-muted shadow-soft">
          Loading admin users...
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Access control"
        title="Users and roles"
        subtitle="Search accounts, track consent, and review verification health for Nexa administrators."
        right={
          <>
            <button
              type="button"
              onClick={() => void loadUsers("", { initial: false })}
              disabled={refreshing}
              className="inline-flex items-center rounded-full border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition hover:bg-white disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <span className="rounded-full border border-line bg-panel px-4 py-2 text-xs text-muted">
              {currentAdminEmail || "Admin"}
            </span>
          </>
        }
      />

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {meta.truncated ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-900">
          Showing the first {users.length} accounts from Appwrite ({totalUsers}+ total). Use search to narrow results.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Total users"
          value={totalUsers.toLocaleString()}
          note="All Appwrite accounts"
          icon={<span className="text-xl">👥</span>}
        />
        <AdminMetricCard
          label="Opted in"
          value={optedInCount.toLocaleString()}
          note="Improving the model"
          icon={<span className="text-xl">✨</span>}
        />
        <AdminMetricCard
          label="Email verified"
          value={emailVerifiedCount.toLocaleString()}
          note="Verified accounts"
          icon={<span className="text-xl">📬</span>}
        />
        <AdminMetricCard
          label="Blocked"
          value={blockedCount.toLocaleString()}
          note="Disabled or locked"
          icon={<span className="text-xl">🛑</span>}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
        <AdminPanel
          title="Directory"
          subtitle="Use filters to quickly narrow by status, consent, or label."
          right={
            <span className="text-xs font-medium text-muted">
              {filteredUsers.length.toLocaleString()} of {users.length.toLocaleString()} shown
            </span>
          }
          className="p-0"
        >
          <div className="flex flex-wrap gap-3 px-6 py-5">
            <div className="flex min-w-[220px] flex-1 items-center rounded-2xl border border-line bg-shell px-3 py-2">
              <svg
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search name, email, or label"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === filter.value
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-panel text-muted hover:text-ink"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {CONSENT_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setConsentFilter(filter.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    consentFilter === filter.value
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-panel text-muted hover:text-ink"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-line">
            {filteredUsers.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted">
                No users match the current filters.
              </div>
            ) : (
              <div className="-mx-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.18em] text-muted">
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-6 py-3 font-semibold">Consent</th>
                      <th className="px-6 py-3 font-semibold">Last login</th>
                      <th className="px-6 py-3 font-semibold">Created</th>
                      <th className="px-6 py-3 font-semibold">Labels</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const selected = user.id === selectedUserId;
                      return (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className={`cursor-pointer border-t border-line/80 transition hover:bg-shell/60 ${
                            selected ? "bg-shell" : "bg-panel"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-ink">{user.name || "—"}</div>
                            <div className="text-xs text-muted">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <ConsentPill optedIn={user.prefs.improveModelForEveryone} />
                            <div className="mt-1 text-xs text-muted">
                              {user.prefs.improveModelForEveryone
                                ? `Since ${formatRelativeTime(user.prefs.trainingOptInAt)}`
                                : `Out since ${formatRelativeTime(user.prefs.trainingOptOutAt)}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-ink">{formatRelativeTime(user.lastLogin)}</td>
                          <td className="px-6 py-4 text-xs text-muted">{formatDateTime(user.registration)}</td>
                          <td className="px-6 py-4">
                            {user.labels.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.labels.map((label) => (
                                  <span
                                    key={label}
                                    className="rounded-full border border-line bg-shell px-2 py-0.5 text-[11px] font-medium text-muted"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill status={user.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel
            title="Selected user"
            subtitle={selectedUser ? selectedUser.email : "Choose a user to see profile details."}
          >
            {selectedUser ? (
              <div className="space-y-5 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Profile</p>
                  <dl className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted">Name</dt>
                      <dd className="font-medium text-ink">{selectedUser.name || "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted">Email verified</dt>
                      <dd className="font-medium text-ink">
                        {selectedUser.emailVerification ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted">Phone verified</dt>
                      <dd className="font-medium text-ink">
                        {selectedUser.phoneVerification ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted">User ID</dt>
                      <dd className="font-mono text-xs text-ink">{selectedUser.id}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted">Created</dt>
                      <dd className="font-medium text-ink">{formatDateTime(selectedUser.registration)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-muted">Last login</dt>
                      <dd className="font-medium text-ink">{formatDateTime(selectedUser.lastLogin)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Consent</p>
                  <div className="mt-3 flex items-center gap-2">
                    <ConsentPill optedIn={selectedUser.prefs.improveModelForEveryone} />
                    <StatusPill status={selectedUser.status} />
                  </div>
                  <dl className="mt-3 space-y-2 text-xs text-muted">
                    <div className="flex items-center justify-between">
                      <dt>Last opt-in</dt>
                      <dd>{formatDateTime(selectedUser.prefs.trainingOptInAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Last opt-out</dt>
                      <dd>{formatDateTime(selectedUser.prefs.trainingOptOutAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Preference updated</dt>
                      <dd>{formatDateTime(selectedUser.prefs.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Labels</p>
                  {selectedUser.labels.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {selectedUser.labels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-line bg-shell px-2 py-0.5 text-[11px] font-medium text-muted"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted">No labels assigned.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-shell px-4 py-6 text-center text-sm text-muted">
                Select a user from the directory to inspect their profile, consent history, and labels.
              </div>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
