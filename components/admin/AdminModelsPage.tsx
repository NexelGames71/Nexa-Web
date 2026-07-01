"use client";

import { useMemo, useState } from "react";

import AdminPageHeader from "./AdminPageHeader";
import AdminPanel from "./AdminPanel";
import {
  AdminButton,
  AdminStatusBadge,
  ConfirmModal,
  DataTable,
  DetailDrawer,
  FilterSelect,
  LiveRefreshBadge,
  MiniBarChart,
  MiniLineChart,
  SearchFilterBar,
  StatCard,
  Toast,
  UsageProgress,
} from "./AdminPrimitives";

type ModelStatus = "active" | "standby" | "training" | "failed" | "disabled";

type ModelRecord = {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: ModelStatus;
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
  updatedAt: string;
};

const modelRegistry: ModelRecord[] = [
  {
    id: "fast-qwen-local",
    name: "Nexa Fast",
    type: "Text generation",
    provider: "Nexa local",
    status: "active",
    version: "qwen-3-4b-2507",
    contextWindow: "32K",
    maxOutputTokens: 768,
    requestsToday: 18420,
    inputTokens: 12_400_000,
    outputTokens: 2_200_000,
    avgLatencyMs: 820,
    errorRate: 0.7,
    costEstimate: "$18.40",
    planAccess: ["Free", "Plus", "Pro", "Business"],
    features: ["chat", "summaries", "browser context"],
    updatedAt: "2 min ago",
  },
  {
    id: "think-qwen-local",
    name: "Nexa Think",
    type: "Reasoning",
    provider: "Nexa local",
    status: "active",
    version: "qwen-3-14b",
    contextWindow: "64K",
    maxOutputTokens: 1536,
    requestsToday: 8120,
    inputTokens: 9_100_000,
    outputTokens: 2_900_000,
    avgLatencyMs: 1850,
    errorRate: 1.1,
    costEstimate: "$32.10",
    planAccess: ["Plus", "Pro", "Business"],
    features: ["planning", "analysis", "coding"],
    updatedAt: "7 min ago",
  },
  {
    id: "deep-reasoner",
    name: "Nexa Deep Think",
    type: "Long context",
    provider: "OpenAI-compatible",
    status: "standby",
    version: "deep-2026-06",
    contextWindow: "128K",
    maxOutputTokens: 4096,
    requestsToday: 1920,
    inputTokens: 5_700_000,
    outputTokens: 1_600_000,
    avgLatencyMs: 4200,
    errorRate: 0.4,
    costEstimate: "$88.70",
    planAccess: ["Pro", "Premium", "Business"],
    features: ["research", "architecture", "long-form"],
    updatedAt: "14 min ago",
  },
  {
    id: "image-clark-sana",
    name: "Clark Air Sana",
    type: "Image generation",
    provider: "Nexa local",
    status: "active",
    version: "1.6b-1.58bit",
    contextWindow: "77 CLIP tokens",
    maxOutputTokens: 0,
    requestsToday: 342,
    inputTokens: 0,
    outputTokens: 0,
    avgLatencyMs: 8200,
    errorRate: 3.8,
    costEstimate: "$11.30",
    planAccess: ["Plus", "Pro", "Premium", "Business"],
    features: ["768px", "24 steps", "guidance 7.0"],
    updatedAt: "1 min ago",
  },
  {
    id: "voice-tts",
    name: "Nexa Voice Studio",
    type: "Voice / TTS",
    provider: "Custom",
    status: "training",
    version: "voice-v0.9",
    contextWindow: "Audio",
    maxOutputTokens: 0,
    requestsToday: 126,
    inputTokens: 0,
    outputTokens: 0,
    avgLatencyMs: 1260,
    errorRate: 2.2,
    costEstimate: "$4.90",
    planAccess: ["Premium", "Business"],
    features: ["tts", "conversation voice", "premium voices"],
    updatedAt: "23 min ago",
  },
  {
    id: "automation-agent",
    name: "Nexa Browser Agent",
    type: "Automation",
    provider: "Nexa hosted",
    status: "active",
    version: "agent-v1",
    contextWindow: "16K",
    maxOutputTokens: 1024,
    requestsToday: 740,
    inputTokens: 1_900_000,
    outputTokens: 420_000,
    avgLatencyMs: 2300,
    errorRate: 1.9,
    costEstimate: "$9.80",
    planAccess: ["Pro", "Business"],
    features: ["tab control", "workflow execution", "risk checks"],
    updatedAt: "4 min ago",
  },
];

const healthTrend = [
  { label: "9a", value: 84 },
  { label: "10a", value: 91 },
  { label: "11a", value: 88 },
  { label: "12p", value: 96 },
  { label: "1p", value: 102 },
  { label: "2p", value: 97 },
  { label: "3p", value: 118 },
];

const queueDepth = [
  { label: "Text", value: 14 },
  { label: "Image", value: 7 },
  { label: "Voice", value: 3 },
  { label: "Agent", value: 5 },
  { label: "Embed", value: 2 },
];

function statusTone(status: ModelStatus) {
  if (status === "active") return "healthy";
  if (status === "training" || status === "standby") return "warning";
  if (status === "failed" || status === "disabled") return "danger";
  return "neutral";
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

export default function AdminModelsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedModel, setSelectedModel] = useState<ModelRecord | null>(modelRegistry[0]);
  const [confirmModel, setConfirmModel] = useState<ModelRecord | null>(null);
  const [toast, setToast] = useState("");

  const filteredModels = useMemo(() => {
    const term = search.trim().toLowerCase();
    return modelRegistry.filter((model) => {
      const matchesSearch =
        !term ||
        [model.name, model.type, model.provider, model.version, model.features.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesType = typeFilter === "all" || model.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const totals = {
    total: modelRegistry.length,
    active: modelRegistry.filter((model) => model.status === "active").length,
    training: modelRegistry.filter((model) => model.status === "training").length,
    requests: modelRegistry.reduce((sum, model) => sum + model.requestsToday, 0),
    latency: Math.round(modelRegistry.reduce((sum, model) => sum + model.avgLatencyMs, 0) / modelRegistry.length),
    errors: Number((modelRegistry.reduce((sum, model) => sum + model.errorRate, 0) / modelRegistry.length).toFixed(1)),
  };

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Model Operations"
        title="Models"
        subtitle="Route, monitor, and control text, image, voice, embedding, moderation, and browser automation models from one operational registry."
        right={
          <>
            <LiveRefreshBadge label="Live health refresh: 30s" />
            <AdminButton variant="primary" onClick={() => setToast("Model configuration draft opened.")}>
              Add model
            </AdminButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total models" value={totals.total} note="Registered inference backends" tone="dark" />
        <StatCard label="Active models" value={totals.active} note="Serving production traffic" tone="healthy" />
        <StatCard label="Requests today" value={totals.requests} note="Across all model types" tone="info" />
        <StatCard label="Error rate" value={totals.errors} note={`Avg latency ${totals.latency}ms`} tone={totals.errors > 2 ? "warning" : "healthy"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
        <AdminPanel
          title="Model registry"
          subtitle="Production and experimental backends with routing, plan access, and health controls."
          right={<AdminStatusBadge label="Mock fallback data" tone="info" />}
        >
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
                  ...Array.from(new Set(modelRegistry.map((model) => model.type))).map((type) => ({
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
              columns={[
                {
                  key: "model",
                  label: "Model",
                  render: (model) => (
                    <div>
                      <p className="font-semibold text-ink">{model.name}</p>
                      <p className="text-xs text-muted">{model.version}</p>
                    </div>
                  ),
                },
                { key: "type", label: "Type", render: (model) => model.type },
                { key: "provider", label: "Provider", render: (model) => model.provider },
                {
                  key: "status",
                  label: "Status",
                  render: (model) => <AdminStatusBadge label={model.status} tone={statusTone(model.status)} pulse={model.status === "active" || model.status === "training"} />,
                },
                { key: "requests", label: "Requests", render: (model) => formatNumber(model.requestsToday) },
                { key: "latency", label: "Latency", render: (model) => `${model.avgLatencyMs}ms` },
                { key: "errors", label: "Errors", render: (model) => `${model.errorRate}%` },
                {
                  key: "actions",
                  label: "Actions",
                  render: (model) => (
                    <div className="flex gap-2">
                      <AdminButton variant="ghost" onClick={() => setSelectedModel(model)}>
                        View
                      </AdminButton>
                      <AdminButton variant="ghost" onClick={() => setToast(`${model.name} routing draft saved.`)}>
                        Route
                      </AdminButton>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Live model health" subtitle="Requests, latency, errors, and queue depth.">
            <MiniLineChart data={healthTrend} tone="info" />
            <div className="grid gap-3 sm:grid-cols-2">
              <UsageProgress label="GPU memory" value={68} max={100} tone="warning" />
              <UsageProgress label="Failover readiness" value={92} max={100} tone="healthy" />
            </div>
          </AdminPanel>
          <AdminPanel title="Queue depth" subtitle="Current work waiting by model family.">
            <MiniBarChart data={queueDepth} tone="dark" />
          </AdminPanel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminPanel title="Mode routing" subtitle="Traffic split and fallback strategy.">
          {[
            ["Fast", "Nexa Fast", "100%", "Qwen local fallback"],
            ["Think", "Nexa Think", "90/10 canary", "Nexa Fast"],
            ["Deep Think", "Nexa Deep Think", "standby", "Think"],
            ["Image", "Clark Air Sana", "768px / 24 steps", "Ideation local"],
          ].map(([mode, primary, rollout, fallback]) => (
            <div key={mode} className="mb-3 rounded-2xl border border-line bg-shell p-4 last:mb-0">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{mode}</p>
                <AdminStatusBadge label={rollout} tone={rollout === "standby" ? "warning" : "healthy"} />
              </div>
              <p className="mt-2 text-sm text-muted">Primary: {primary}</p>
              <p className="text-sm text-muted">Fallback: {fallback}</p>
            </div>
          ))}
        </AdminPanel>

        <AdminPanel title="Plan access controls" subtitle="Current model entitlement map.">
          {["Free", "Plus", "Pro", "Premium", "Business", "Enterprise"].map((plan) => (
            <div key={plan} className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-shell p-4 last:mb-0">
              <div>
                <p className="font-semibold text-ink">{plan}</p>
                <p className="text-sm text-muted">{plan === "Free" ? "Fast + limited image" : "Expanded model access"}</p>
              </div>
              <AdminButton variant="secondary" onClick={() => setToast(`${plan} access editor opened.`)}>
                Edit
              </AdminButton>
            </div>
          ))}
        </AdminPanel>

        <AdminPanel title="Safety controls" subtitle="Operational limits and sensitive action gates.">
          <div className="space-y-3">
            <UsageProgress label="Moderation coverage" value={96} max={100} tone="healthy" />
            <UsageProgress label="Timeout budget used" value={41} max={100} tone="warning" />
            <UsageProgress label="NSFW image rejects" value={7} max={100} tone="danger" />
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Model disable/delete requires confirmation and should be audit logged before backend mutation.
            </div>
          </div>
        </AdminPanel>
      </div>

      <DetailDrawer
        open={Boolean(selectedModel)}
        title={selectedModel?.name || "Model"}
        subtitle={selectedModel ? `${selectedModel.type} • ${selectedModel.provider}` : undefined}
        onClose={() => setSelectedModel(null)}
      >
        {selectedModel ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge label={selectedModel.status} tone={statusTone(selectedModel.status)} pulse={selectedModel.status === "active"} />
              <AdminStatusBadge label={selectedModel.version} tone="neutral" />
              <AdminStatusBadge label={selectedModel.contextWindow} tone="info" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Requests today" value={selectedModel.requestsToday} tone="info" />
              <StatCard label="Avg latency" value={selectedModel.avgLatencyMs} note="milliseconds" tone={selectedModel.avgLatencyMs > 3000 ? "warning" : "healthy"} />
            </div>
            <AdminPanel title="Limits and access">
              <div className="space-y-3 text-sm">
                <p><span className="font-semibold text-ink">Max output:</span> {selectedModel.maxOutputTokens || "N/A"}</p>
                <p><span className="font-semibold text-ink">Plans:</span> {selectedModel.planAccess.join(", ")}</p>
                <p><span className="font-semibold text-ink">Features:</span> {selectedModel.features.join(", ")}</p>
                <p><span className="font-semibold text-ink">Cost today:</span> {selectedModel.costEstimate}</p>
              </div>
            </AdminPanel>
            <AdminPanel title="Recent health">
              <MiniLineChart data={healthTrend} tone={selectedModel.errorRate > 2 ? "warning" : "healthy"} />
              <UsageProgress label="Reliability" value={Math.max(0, 100 - selectedModel.errorRate * 8)} max={100} tone={selectedModel.errorRate > 2 ? "warning" : "healthy"} />
            </AdminPanel>
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="primary" onClick={() => setToast(`${selectedModel.name} set as default draft.`)}>
                Set as default
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setToast(`${selectedModel.name} logs opened.`)}>
                View logs
              </AdminButton>
              <AdminButton variant="danger" onClick={() => setConfirmModel(selectedModel)}>
                Disable
              </AdminButton>
            </div>
          </div>
        ) : null}
      </DetailDrawer>

      <ConfirmModal
        open={Boolean(confirmModel)}
        title="Disable model?"
        description="Disabling a production model can reroute traffic and affect active users. This action should be audit logged before backend mutation."
        confirmLabel="Disable model"
        onClose={() => setConfirmModel(null)}
        onConfirm={() => {
          setToast(`${confirmModel?.name || "Model"} disable action queued for audit.`);
          setConfirmModel(null);
        }}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
