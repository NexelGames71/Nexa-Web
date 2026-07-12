"use client";

import { useEffect, useMemo, useState } from "react";

import { createSessionJwt } from "../../lib/appwrite";
import AdminPageHeader from "./AdminPageHeader";
import AdminPanel from "./AdminPanel";
import {
  AdminButton,
  AdminStatusBadge,
  DataTable,
  DetailDrawer,
  EmptyState,
  ErrorState,
  FilterSelect,
  LiveRefreshBadge,
  LoadingSkeleton,
  MiniBarChart,
  MiniLineChart,
  SearchFilterBar,
  StatCard,
  Toast,
  UsageProgress,
} from "./AdminPrimitives";

type ModelRecord = {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: string;
  version: string;
  contextWindow: string;
  maxOutputTokens: number;
  requestsToday: number;
  inputTokens: number;
  outputTokens: number;
  avgLatencyMs: number;
  errorRate: number;
  costEstimate: string;
  planAccess: string[];
  features: string[];
  endpoint?: string;
  runtime?: string;
  usageSource?: string;
  updatedAt: string;
  lastUsedAt?: string;
};

type ModelsMeta = {
  usageRows?: number;
  usageRowsFetched?: number;
  periodStart?: string;
  updatedAt?: string;
};

function statusTone(status: string) {
  if (status === "active") return "healthy";
  if (status === "training" || status === "standby" || status === "draft") return "warning";
  if (status === "failed" || status === "disabled") return "danger";
  return "neutral";
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

async function fetchModels(authorizedFetch: (path: string, options?: RequestInit) => Promise<Response>) {
  const response = await authorizedFetch("/api/admin/models", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to load model registry.");
  }
  return {
    items: data.items || [],
    meta: data.meta || {},
  };
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [meta, setMeta] = useState<ModelsMeta>({});
  const [authToken, setAuthToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedModel, setSelectedModel] = useState<ModelRecord | null>(null);
  const [toast, setToast] = useState("");

  async function getValidAuthToken(forceRefresh = false) {
    if (!forceRefresh && authToken) {
      return authToken;
    }

    const jwt = await createSessionJwt();
    setAuthToken(jwt);
    return jwt;
  }

  async function authorizedFetch(path: string, options: RequestInit = {}) {
    const jwt = await getValidAuthToken();
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${jwt}`);

    let response = await fetch(path, { ...options, headers });

    if (response.status === 401) {
      const refreshedJwt = await getValidAuthToken(true);
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${refreshedJwt}`);
      response = await fetch(path, { ...options, headers: retryHeaders });
    }

    return response;
  }

  async function loadModels() {
    setLoading((current) => current || models.length === 0);
    setError("");
    try {
      const { items, meta: nextMeta } = await fetchModels(authorizedFetch);
      setModels(items);
      setMeta(nextMeta);
      setSelectedModel((current) => {
        if (!current) return items[0] || null;
        return items.find((item: ModelRecord) => item.id === current.id) || items[0] || null;
      });
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load model registry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadModels();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadModels();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [authToken, models.length]);

  const filteredModels = useMemo(() => {
    const term = search.trim().toLowerCase();
    return models.filter((model) => {
      const matchesSearch =
        !term ||
        [model.name, model.type, model.provider, model.version, model.features.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesType = typeFilter === "all" || model.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [models, search, typeFilter]);

  const totals = {
    total: models.length,
    active: models.filter((model) => model.status === "active").length,
    training: models.filter((model) => model.status === "training").length,
    requests: models.reduce((sum, model) => sum + Number(model.requestsToday || 0), 0),
    latency: models.length
      ? Math.round(models.reduce((sum, model) => sum + Number(model.avgLatencyMs || 0), 0) / models.length)
      : 0,
    errors: models.length
      ? Number((models.reduce((sum, model) => sum + Number(model.errorRate || 0), 0) / models.length).toFixed(1))
      : 0,
  };
  const healthTrend = models.slice(0, 7).map((model) => ({
    label: model.name.slice(0, 8),
    value: Math.max(1, 100 - Number(model.errorRate || 0) * 10),
  }));
  const queueDepth = Object.entries(
    models.reduce<Record<string, number>>((acc, model) => {
      acc[model.type] = (acc[model.type] || 0) + Number(model.requestsToday || 0);
      return acc;
    }, {}),
  ).map(([label, value]) => ({ label, value }));

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Model Operations"
        title="Models"
        subtitle="Route, monitor, and control every active Nexa text, image, voice, speech, wake, and browser automation model."
        right={
          <>
            <LiveRefreshBadge label={loading ? "Refreshing live usage" : "Live usage synced"} />
            <AdminButton variant="primary" onClick={() => void loadModels()}>
              Refresh
            </AdminButton>
          </>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void loadModels()} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total models" value={totals.total} note="Active Nexa model stack" tone="dark" />
        <StatCard label="Active models" value={totals.active} note="Serving production traffic" tone="healthy" />
        <StatCard label="Requests today" value={totals.requests} note={`${formatNumber(meta.usageRows || 0)} usage rows today`} tone="info" />
        <StatCard label="Error rate" value={totals.errors} note={`Avg latency ${totals.latency}ms`} tone={totals.errors > 2 ? "warning" : "healthy"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
        <AdminPanel
          title="Active model registry"
          subtitle={`Production backends with live request, token, latency, and error telemetry. Last sync ${meta.updatedAt ? new Date(meta.updatedAt).toLocaleTimeString() : "pending"}.`}
        >
          {loading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <>
              <SearchFilterBar
                search={search}
                onSearch={setSearch}
                filters={
                  <FilterSelect
                    label="Type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                      { value: "all", label: "All model types" },
                      ...Array.from(new Set(models.map((model) => model.type))).map((type) => ({
                        value: type,
                        label: type,
                      })),
                    ]}
                  />
                }
              />
              <div className="mt-4">
                <DataTable
                  rows={filteredModels}
                  rowKey={(model) => model.id}
                  onRowClick={(model) => setSelectedModel(model)}
                  empty={
                    <EmptyState
                      title="No model records"
                      description="Active Nexa defaults should appear here. Check the admin model API if this remains empty."
                    />
                  }
                  columns={[
                    {
                      key: "model",
                      label: "Model",
                      render: (model) => (
                        <div>
                          <p className="font-semibold text-ink">{model.name}</p>
                          <p className="text-xs text-muted">{model.version || model.id}</p>
                        </div>
                      ),
                    },
                    { key: "type", label: "Type", render: (model) => model.type },
                    { key: "provider", label: "Provider", render: (model) => model.provider },
                    { key: "status", label: "Status", render: (model) => <AdminStatusBadge label={model.status} tone={statusTone(model.status)} pulse={model.status === "active" || model.status === "training"} /> },
                    { key: "context", label: "Context", render: (model) => model.contextWindow },
                    { key: "requests", label: "Requests", render: (model) => formatNumber(model.requestsToday) },
                    { key: "tokens", label: "Tokens", render: (model) => formatNumber(Number(model.inputTokens || 0) + Number(model.outputTokens || 0)) },
                    { key: "latency", label: "Latency", render: (model) => `${model.avgLatencyMs || 0}ms` },
                    { key: "errors", label: "Errors", render: (model) => `${model.errorRate || 0}%` },
                    { key: "lastUsed", label: "Last used", render: (model) => model.lastUsedAt ? new Date(model.lastUsedAt).toLocaleTimeString() : "No traffic" },
                  ]}
                />
              </div>
            </>
          )}
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Live model health" subtitle="Derived from model usage records.">
            {healthTrend.length ? <MiniLineChart data={healthTrend} tone="info" /> : <EmptyState title="No health records" description="Model usage records will populate this chart after requests are logged." />}
            <div className="grid gap-3 sm:grid-cols-2">
              <UsageProgress label="Reliability" value={Math.max(0, 100 - totals.errors * 10)} max={100} tone={totals.errors > 2 ? "warning" : "healthy"} />
              <UsageProgress label="Active coverage" value={totals.total ? Math.round((totals.active / totals.total) * 100) : 0} max={100} tone="healthy" />
            </div>
          </AdminPanel>
          <AdminPanel title="Usage by model type" subtitle="Current request distribution.">
            {queueDepth.length ? <MiniBarChart data={queueDepth} tone="dark" /> : <EmptyState title="No usage yet" description="Requests by model type will appear after model usage rows are written." />}
          </AdminPanel>
        </div>
      </div>

      <DetailDrawer
        open={Boolean(selectedModel)}
        title={selectedModel?.name || "Model"}
        subtitle={selectedModel ? `${selectedModel.type} - ${selectedModel.provider}` : undefined}
        onClose={() => setSelectedModel(null)}
      >
        {selectedModel ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge label={selectedModel.status} tone={statusTone(selectedModel.status)} pulse={selectedModel.status === "active"} />
              {selectedModel.version ? <AdminStatusBadge label={selectedModel.version} tone="neutral" /> : null}
              <AdminStatusBadge label={selectedModel.contextWindow} tone="info" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Requests today" value={selectedModel.requestsToday} tone="info" />
              <StatCard label="Avg latency" value={selectedModel.avgLatencyMs} note="milliseconds" tone={selectedModel.avgLatencyMs > 3000 ? "warning" : "healthy"} />
            </div>
            <AdminPanel title="Limits and access">
              <div className="space-y-3 text-sm">
                <p><span className="font-semibold text-ink">Max output:</span> {selectedModel.maxOutputTokens || "Not set"}</p>
                <p><span className="font-semibold text-ink">Plans:</span> {selectedModel.planAccess.length ? selectedModel.planAccess.join(", ") : "No plan access configured"}</p>
                <p><span className="font-semibold text-ink">Features:</span> {selectedModel.features.length ? selectedModel.features.join(", ") : "No feature flags configured"}</p>
                <p><span className="font-semibold text-ink">Cost today:</span> {selectedModel.costEstimate}</p>
              </div>
            </AdminPanel>
            <AdminPanel title="Routing and usage">
              <div className="space-y-3 text-sm">
                <p><span className="font-semibold text-ink">Endpoint:</span> {selectedModel.endpoint || "Not configured"}</p>
                <p><span className="font-semibold text-ink">Runtime:</span> {selectedModel.runtime || "Not configured"}</p>
                <p><span className="font-semibold text-ink">Input tokens:</span> {formatNumber(selectedModel.inputTokens)}</p>
                <p><span className="font-semibold text-ink">Output tokens:</span> {formatNumber(selectedModel.outputTokens)}</p>
                <p><span className="font-semibold text-ink">Last used:</span> {selectedModel.lastUsedAt ? new Date(selectedModel.lastUsedAt).toLocaleString() : "No traffic today"}</p>
                <p><span className="font-semibold text-ink">Usage source:</span> {selectedModel.usageSource || "Model usage records"}</p>
              </div>
            </AdminPanel>
          </div>
        ) : null}
      </DetailDrawer>

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
