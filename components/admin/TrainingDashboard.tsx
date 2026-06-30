// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { account, appwriteConfigured, createSessionJwt } from "../../lib/appwrite";
import AdminMetricCard from "./AdminMetricCard";
import AdminPageHeader from "./AdminPageHeader";
import AdminPanel from "./AdminPanel";
import StatusBadge from "./StatusBadge";

const EXPORT_ACTIONS = [
  { value: "full", label: "Run full export" },
  { value: "incremental", label: "Run incremental export" },
];

const SECTION_LINKS = [
  { id: "overview", label: "Overview" },
  { id: "exports", label: "Exports" },
  { id: "details", label: "Selected export" },
];

function Icon({ name, className = "h-5 w-5", stroke = 1.8 }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...common} d="M16 20v-1.2A3.8 3.8 0 0 0 12.2 15H7.8A3.8 3.8 0 0 0 4 18.8V20" />
          <circle {...common} cx="10" cy="8" r="3" />
          <path {...common} d="M20 20v-1a3.2 3.2 0 0 0-2.4-3.1" />
          <path {...common} d="M15.8 5.2A3 3 0 0 1 15.8 11" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...common} d="m5 12 4.2 4.2L19 6.5" />
        </svg>
      );
    case "close-user":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path {...common} d="m17 8 4 4" />
          <path {...common} d="m21 8-4 4" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...common} d="M20 11.5A7.5 7.5 0 0 1 12.5 19H8l-4 3v-7A7.5 7.5 0 0 1 11.5 4h1A7.5 7.5 0 0 1 20 11.5Z" />
        </svg>
      );
    case "database":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <ellipse {...common} cx="12" cy="6" rx="7" ry="3" />
          <path {...common} d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
          <path {...common} d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </svg>
      );
    case "download":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path {...common} d="M12 4v10" />
          <path {...common} d="m7.5 10.5 4.5 4.5 4.5-4.5" />
          <path {...common} d="M5 19.5h14" />
        </svg>
      );
    default:
      return null;
  }
}

function formatTimestamp(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}M`;
  }
  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(number >= 100_000 ? 0 : 1)}K`;
  }
  return String(number);
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-shell px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function TrainingDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [exports, setExports] = useState([]);
  const [selectedExportId, setSelectedExportId] = useState("");
  const [selectedExport, setSelectedExport] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [runningScope, setRunningScope] = useState("");
  const [downloadingExportId, setDownloadingExportId] = useState("");

  async function getValidAuthToken(forceRefresh = false) {
    if (!forceRefresh && authToken) {
      return authToken;
    }

    const jwt = await createSessionJwt();
    setAuthToken(jwt);
    return jwt;
  }

  async function authorizedFetch(path, options = {}, tokenOverride = "") {
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

  async function loadAdminData(tokenOverride = "") {
    const [overviewResponse, exportsResponse] = await Promise.all([
      authorizedFetch("/api/admin/training/overview", {}, tokenOverride),
      authorizedFetch("/api/admin/training/exports", {}, tokenOverride),
    ]);
    const overviewData = await overviewResponse.json().catch(() => ({}));
    const exportsData = await exportsResponse.json().catch(() => ({}));

    if (!overviewResponse.ok || !exportsResponse.ok) {
      throw new Error(
        overviewData.error || exportsData.error || "Failed to load training admin data.",
      );
    }

    const items = Array.isArray(exportsData.items) ? exportsData.items : [];
    setOverview(overviewData.overview || null);
    setExports(items);
    setSelectedExportId((current) => current || items[0]?.id || overviewData.overview?.latestExport?.id || "");
  }

  async function loadExportDetails(exportId, tokenOverride = "") {
    if (!exportId) {
      setSelectedExport(null);
      setDownloadLinks(null);
      return;
    }

    const response = await authorizedFetch(
      `/api/admin/training/exports/${exportId}`,
      {},
      tokenOverride,
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Failed to load export details.");
    }

    setSelectedExport(data.item || null);
    setDownloadLinks(null);
  }

  useEffect(() => {
    async function initialize() {
      if (!appwriteConfigured) {
        router.replace("/login");
        return;
      }

      try {
        const user = await account.get();
        const jwt = await createSessionJwt();
        setCurrentUser(user);
        setAuthToken(jwt);
        await loadAdminData(jwt);
      } catch (error) {
        if (error?.code === 401) {
          router.replace("/login");
          return;
        }

        setLoadError(error?.message || "Failed to load admin route.");
      } finally {
        setAuthLoading(false);
      }
    }

    initialize();
  }, [router]);

  useEffect(() => {
    if (!selectedExportId || authLoading) {
      return;
    }

    void loadExportDetails(selectedExportId).catch((error) => {
      setLoadError(error.message || "Failed to load export details.");
    });
  }, [authLoading, selectedExportId]);

  async function handleRunExport(scope) {
    setRunningScope(scope);
    setLoadError("");

    try {
      const response = await authorizedFetch("/api/admin/training/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to run export.");
      }

      const exportId = data.export?.id || data.export?.$id || "";
      await loadAdminData();
      if (exportId) {
        setSelectedExportId(exportId);
        await loadExportDetails(exportId);
      }
    } catch (error) {
      setLoadError(error.message || "Failed to run export.");
    } finally {
      setRunningScope("");
    }
  }

  async function handlePrepareDownloads(exportId) {
    setDownloadingExportId(exportId);
    setLoadError("");

    try {
      const response = await authorizedFetch(`/api/admin/training/exports/${exportId}/download`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare download links.");
      }

      setDownloadLinks(data);
    } catch (error) {
      setLoadError(error.message || "Failed to prepare download links.");
    } finally {
      setDownloadingExportId("");
    }
  }

  const optedInUsers = Number(overview?.optedInUsers || 0);
  const optedOutUsers = Number(overview?.optedOutUsers || 0);
  const totalUsers = Number(overview?.totalUsers || 0);
  const optInRate = totalUsers > 0 ? `${((optedInUsers / totalUsers) * 100).toFixed(1)}%` : "0.0%";
  const latestExport = overview?.latestExport || null;

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="rounded-3xl border border-line bg-panel px-6 py-5 text-sm text-muted shadow-soft">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Training operations"
        title="Consent and export control"
        subtitle="Only real consent, export, and dataset data is shown here."
        right={
          <span className="rounded-full border border-line bg-panel px-4 py-2 text-sm text-muted shadow-soft">
            {currentUser?.email || "Unavailable"}
          </span>
        }
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        {SECTION_LINKS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-full border border-line bg-panel px-4 py-2 text-sm text-muted transition hover:border-ink/20 hover:text-ink"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <section id="overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard
          label="Total users"
          value={formatCompactNumber(totalUsers)}
          note="All Appwrite users"
          icon={<Icon name="users" className="h-6 w-6" />}
        />
        <AdminMetricCard
          label="Opted-in users"
          value={formatCompactNumber(optedInUsers)}
          note={`Consent rate ${optInRate}`}
          icon={<Icon name="check" className="h-6 w-6" />}
        />
        <AdminMetricCard
          label="Opted-out users"
          value={formatCompactNumber(optedOutUsers)}
          note="Users excluded from training exports"
          icon={<Icon name="close-user" className="h-6 w-6" />}
        />
        <AdminMetricCard
          label="Eligible conversations"
          value={formatCompactNumber(overview?.eligibleConversations || 0)}
          note="Owned by opted-in users"
          icon={<Icon name="chat" className="h-6 w-6" />}
        />
        <AdminMetricCard
          label="Eligible messages"
          value={formatCompactNumber(overview?.eligibleMessages || 0)}
          note="Current exportable message volume"
          icon={<Icon name="database" className="h-6 w-6" />}
        />
        <AdminMetricCard
          label="Latest export"
          value={formatCompactNumber(latestExport?.totalExamples || 0)}
          note={latestExport?.status ? `Status: ${latestExport.status}` : "No completed export yet"}
          icon={<Icon name="download" className="h-6 w-6" />}
        />
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <AdminPanel title="Consent summary" subtitle="Live totals from opted-in preferences and export metadata.">
          <dl className="grid gap-y-4 text-sm sm:grid-cols-2 sm:gap-x-8">
            <div>
              <dt className="text-muted">Opt-in rate</dt>
              <dd className="mt-1 text-lg font-semibold text-ink">{optInRate}</dd>
            </div>
            <div>
              <dt className="text-muted">Latest export status</dt>
              <dd className="mt-2">
                {latestExport?.status ? (
                  <StatusBadge status={latestExport.status} />
                ) : (
                  <span className="text-muted">No export yet</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Last completed export</dt>
              <dd className="mt-1 text-ink">{formatTimestamp(latestExport?.completedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Latest watermark</dt>
              <dd className="mt-1 text-ink">{formatTimestamp(latestExport?.lastMessageCreatedAtIncluded)}</dd>
            </div>
            <div>
              <dt className="text-muted">Latest export files</dt>
              <dd className="mt-1 text-ink">{latestExport?.totalFiles || 0}</dd>
            </div>
            <div>
              <dt className="text-muted">Latest export scope</dt>
              <dd className="mt-1 capitalize text-ink">{latestExport?.scope || "Not available"}</dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="Latest export snapshot" subtitle="Most recent completed dataset build.">
          {latestExport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-ink">{latestExport.exportName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {latestExport.mode} / {latestExport.scope}
                  </p>
                </div>
                <StatusBadge status={latestExport.status} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label="Examples" value={formatCompactNumber(latestExport.totalExamples)} />
                <StatTile label="Messages" value={formatCompactNumber(latestExport.totalEligibleMessages)} />
                <StatTile label="Files" value={latestExport.totalFiles} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-shell px-4 py-4 text-sm text-muted">
              No completed export is available yet.
            </div>
          )}
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel
          id="exports"
          title="Export queue"
          subtitle="Run full or incremental exports, then inspect the resulting job history."
          right={
            <div className="flex flex-wrap gap-2">
              {EXPORT_ACTIONS.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => void handleRunExport(action.value)}
                  disabled={Boolean(runningScope)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60",
                    action.value === "full"
                      ? "bg-ink text-white hover:opacity-90"
                      : "border border-line bg-shell text-ink hover:bg-white",
                  ].join(" ")}
                >
                  {runningScope === action.value ? "Running..." : action.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="overflow-hidden rounded-2xl border border-line">
            <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_1fr_0.8fr] gap-3 border-b border-line bg-shell px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <div>Export</div>
              <div>Status</div>
              <div>Examples</div>
              <div>Files</div>
              <div>Started</div>
              <div>Download</div>
            </div>

            <div className="divide-y divide-line">
              {exports.length > 0 ? (
                exports.map((item) => (
                  <div
                    key={item.id}
                    className={[
                      "grid grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_1fr_0.8fr] gap-3 px-4 py-3 text-sm",
                      selectedExportId === item.id ? "bg-sidebar/80" : "bg-panel",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedExportId(item.id)}
                      className="truncate text-left font-medium text-ink"
                    >
                      {item.exportName}
                    </button>
                    <div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-ink">{formatCompactNumber(item.totalExamples)}</div>
                    <div className="text-ink">{item.totalFiles}</div>
                    <div className="text-muted">{formatTimestamp(item.startedAt)}</div>
                    <div>
                      <button
                        type="button"
                        onClick={() => void handlePrepareDownloads(item.id)}
                        className="rounded-full border border-line bg-shell px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-white"
                      >
                        {downloadingExportId === item.id ? "Preparing..." : "Prepare"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-panel px-4 py-5 text-sm text-muted">No export jobs yet.</div>
              )}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Download bundle"
          subtitle="Signed links are generated only when requested for the selected export."
        >
          {downloadLinks ? (
            <div className="space-y-3">
              <a
                href={downloadLinks.manifest.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-line bg-shell px-4 py-3 text-sm text-ink transition hover:bg-white"
              >
                export_manifest.json
              </a>
              <a
                href={downloadLinks.optedInUsersSummary.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-line bg-shell px-4 py-3 text-sm text-ink transition hover:bg-white"
              >
                opted_in_users_summary.json
              </a>
              {downloadLinks.files.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-line bg-shell px-4 py-3 text-sm text-ink transition hover:bg-white"
                >
                  {file.fileName}
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-shell px-4 py-4 text-sm text-muted">
              Select an export and prepare signed links when you need the files.
            </div>
          )}
        </AdminPanel>
      </div>

      <div className="mt-6">
        <AdminPanel
          id="details"
          title="Selected export"
          subtitle="Real job metadata and generated part files for the current selection."
          right={
            selectedExport ? (
              <button
                type="button"
                onClick={() => void handlePrepareDownloads(selectedExport.id)}
                disabled={downloadingExportId === selectedExport.id}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {downloadingExportId === selectedExport.id ? "Preparing..." : "Prepare signed links"}
              </button>
            ) : null
          }
        >
          {selectedExport ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-line bg-shell p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-ink">{selectedExport.exportName}</p>
                    <p className="mt-1 text-sm capitalize text-muted">
                      {selectedExport.mode} / {selectedExport.scope}
                    </p>
                  </div>
                  <StatusBadge status={selectedExport.status} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <StatTile label="Opted in users" value={formatCompactNumber(selectedExport.totalOptedInUsers)} />
                  <StatTile label="Examples" value={formatCompactNumber(selectedExport.totalExamples)} />
                  <StatTile
                    label="Conversations"
                    value={formatCompactNumber(selectedExport.totalEligibleConversations)}
                  />
                  <StatTile label="Messages" value={formatCompactNumber(selectedExport.totalEligibleMessages)} />
                </div>

                <dl className="mt-5 space-y-2 text-sm text-muted">
                  <div>Started: {formatTimestamp(selectedExport.startedAt)}</div>
                  <div>Completed: {formatTimestamp(selectedExport.completedAt)}</div>
                  <div>Failed: {formatTimestamp(selectedExport.failedAt)}</div>
                  <div>Watermark: {formatTimestamp(selectedExport.lastMessageCreatedAtIncluded)}</div>
                  <div className="break-all text-ink">R2 Prefix: {selectedExport.r2Prefix || "Not available"}</div>
                  {selectedExport.errorMessage ? (
                    <div className="text-red-600">Error: {selectedExport.errorMessage}</div>
                  ) : null}
                </dl>
              </div>

              <div className="rounded-2xl border border-line bg-shell p-4">
                <p className="mb-4 text-base font-semibold text-ink">Part files</p>
                <div className="space-y-3">
                  {selectedExport.files.length > 0 ? (
                    selectedExport.files.map((file) => (
                      <div key={file.id} className="rounded-2xl border border-line bg-panel px-4 py-3">
                        <p className="text-sm font-medium text-ink">{file.fileName}</p>
                        <p className="mt-1 text-xs text-muted">
                          {formatCompactNumber(file.exampleCount)} examples / {file.fileSizeBytes} bytes
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line bg-panel px-4 py-4 text-sm text-muted">
                      No part files were produced for this export.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-shell px-4 py-4 text-sm text-muted">
              Select an export job from the queue to inspect it.
            </div>
          )}
        </AdminPanel>
      </div>

      <p className="mt-8 text-center text-xs text-muted lg:hidden">
        <Link href="/chat" className="underline underline-offset-4">
          Back to chat
        </Link>
      </p>
    </div>
  );
}
