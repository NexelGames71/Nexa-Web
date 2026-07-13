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
  SearchFilterBar,
  StatCard,
  Toast,
} from "./AdminPrimitives";

type Promotion = {
  id: string;
  name: string;
  title: string;
  description: string;
  promotionType: string;
  applicationMode: string;
  status: string;
  code: string;
  category: string;
  startsAt: string;
  endsAt: string;
  totalRedemptionLimit: number;
  perUserLimit: number;
  budgetLimit: number;
  redemptionCount: number;
  uniqueUsersReached: number;
  revenueGenerated: number;
  discountValueGranted: number;
  creditsGranted: number;
  conversionRate: number;
  promotionCost: number;
  rejectedAttempts: number;
  createdBy: string;
  updatedAt: string;
  rewards: any[];
  eligibilityRules: any[];
  limits: any[];
  abuseControls: string[];
};

type Catalog = {
  statuses: string[];
  applicationModes: string[];
  stackingPolicies: string[];
  promotionTypes: { id: string; label: string; category: string }[];
  rewardTypes: string[];
  eligibilityRuleTypes: string[];
  limitTypes: string[];
  triggerEvents: string[];
  presentationSurfaces: string[];
  abuseControls: string[];
  initialReleasePromotions: string[];
};

type PromotionsData = {
  catalog: Catalog;
  promotions: Promotion[];
  dashboard: Record<string, any>;
  warning?: string;
  requiredCollections: string[];
};

const emptyCatalog: Catalog = {
  statuses: [],
  applicationModes: [],
  stackingPolicies: [],
  promotionTypes: [],
  rewardTypes: [],
  eligibilityRuleTypes: [],
  limitTypes: [],
  triggerEvents: [],
  presentationSurfaces: [],
  abuseControls: [],
  initialReleasePromotions: [],
};

const defaultForm = {
  name: "",
  title: "",
  description: "",
  promotionType: "percentage_discount",
  applicationMode: "CODE",
  status: "DRAFT",
  code: "",
  rewardType: "PERCENTAGE_DISCOUNT",
  rewardValue: "25",
  eligiblePlans: "plus,pro",
  totalRedemptionLimit: "5000",
  perUserLimit: "1",
  budgetLimit: "25000",
  startsAt: "",
  endsAt: "",
  publicCampaign: true,
};

function statusTone(status: string) {
  if (status === "ACTIVE") return "healthy";
  if (["SCHEDULED", "DRAFT"].includes(status)) return "info";
  if (["PAUSED", "EXHAUSTED"].includes(status)) return "warning";
  if (["EXPIRED", "CANCELLED"].includes(status)) return "danger";
  return "neutral";
}

function money(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function humanize(value: string) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function shortDate(value: string) {
  if (!value) return "Not set";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

async function fetchPromotions(authorizedFetch: (path: string, options?: RequestInit) => Promise<Response>) {
  const response = await authorizedFetch("/api/admin/promotions", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to load promotions.");
  }
  return data as PromotionsData;
}

export default function AdminPromotionsPage() {
  const [data, setData] = useState<PromotionsData>({
    catalog: emptyCatalog,
    promotions: [],
    dashboard: {},
    requiredCollections: [],
  });
  const [authToken, setAuthToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [form, setForm] = useState(defaultForm);

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

  async function loadPromotions() {
    setLoading(true);
    setError("");
    try {
      const nextData = await fetchPromotions(authorizedFetch);
      setData(nextData);
      setSelectedPromotion((current) => current || nextData.promotions[0] || null);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPromotions();
  }, []);

  const filteredPromotions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.promotions.filter((promotion) => {
      const matchesSearch =
        !term ||
        [promotion.name, promotion.title, promotion.code, promotion.promotionType, promotion.category]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || promotion.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.promotions, search, statusFilter]);

  async function handleCreatePromotion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const selectedType = data.catalog.promotionTypes.find((type) => type.id === form.promotionType);
      const response = await authorizedFetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          title: form.title || form.name,
          description: form.description,
          promotionType: form.promotionType,
          category: selectedType?.category || "",
          applicationMode: form.applicationMode,
          status: form.status,
          code: form.code,
          publicCampaign: form.publicCampaign,
          priority: 100,
          stackingPolicy: "NOT_STACKABLE",
          startsAt: form.startsAt,
          endsAt: form.endsAt,
          timezone: "UTC",
          totalRedemptionLimit: Number(form.totalRedemptionLimit || 0),
          perUserLimit: Number(form.perUserLimit || 1),
          budgetLimit: Number(form.budgetLimit || 0),
          rewards: [
            {
              rewardType: form.rewardType,
              value: form.rewardValue,
              duration: "configurable",
              applicablePlans: form.eligiblePlans.split(",").map((plan) => plan.trim()).filter(Boolean),
            },
          ],
          eligibilityRules: [
            {
              ruleType: "PLAN",
              operator: "IN",
              value: form.eligiblePlans,
            },
          ],
          limits: [
            { limitType: "TOTAL_REDEMPTIONS", value: Number(form.totalRedemptionLimit || 0) },
            { limitType: "PER_USER", value: Number(form.perUserLimit || 1) },
            { limitType: "CAMPAIGN_BUDGET", value: Number(form.budgetLimit || 0) },
          ],
          schedule: {
            activateImmediately: form.status === "ACTIVE",
            automaticallyExpire: Boolean(form.endsAt),
          },
          presentation: {
            surfaces: ["PRICING_PAGE_BANNER", "CHECKOUT_MESSAGE", "UPGRADE_MODAL"],
            callToAction: "Claim offer",
          },
          abuseControls: data.catalog.abuseControls,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create promotion.");
      }
      setToast("Promotion created.");
      setForm(defaultForm);
      await loadPromotions();
      setSelectedPromotion(result.promotion || null);
    } catch (saveError: any) {
      setError(saveError?.message || "Failed to create promotion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Growth Operations"
        title="Promotions"
        subtitle="Create reusable promotion campaigns from controlled reward types, eligibility rules, schedules, limits, stacking policies, and abuse controls."
        right={
          <>
            <LiveRefreshBadge label={data.warning ? "Catalog only" : "Promotion engine ready"} paused={Boolean(data.warning)} />
            <AdminButton variant="primary" onClick={() => void loadPromotions()}>
              Refresh
            </AdminButton>
          </>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void loadPromotions()} /> : null}
      {data.warning ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {data.warning} Create the required Appwrite collections before saving campaigns.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active promotions" value={data.dashboard.totalActive || 0} note="Currently redeemable" tone="healthy" />
        <StatCard label="Scheduled" value={data.dashboard.scheduled || 0} note="Waiting for start date" tone="info" />
        <StatCard label="Drafts" value={data.dashboard.drafts || 0} note="Not visible to users" tone="dark" />
        <StatCard label="Total redemptions" value={data.dashboard.totalRedemptions || 0} note="All campaigns" tone="neutral" />
        <StatCard label="Unique users reached" value={data.dashboard.uniqueUsersReached || 0} note="Promotion recipients" tone="info" />
        <StatCard label="Discount granted" value={money(data.dashboard.discountValueGranted || 0)} note="Estimated USD value" tone="warning" />
        <StatCard label="Credits granted" value={data.dashboard.creditsGranted || 0} note="Usage credits issued" tone="healthy" />
        <StatCard label="Rejected attempts" value={data.dashboard.rejectedAttempts || 0} note="Abuse controls" tone={(data.dashboard.rejectedAttempts || 0) > 0 ? "danger" : "neutral"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <AdminPanel
          title="Promotion campaigns"
          subtitle="Named campaigns reuse the same promotion types with different configuration values."
        >
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            filters={
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All statuses" },
                  ...data.catalog.statuses.map((status) => ({ value: status, label: humanize(status) })),
                ]}
              />
            }
          />

          <div className="mt-4">
            {loading ? (
              <LoadingSkeleton rows={8} />
            ) : (
              <DataTable<Promotion>
                rows={filteredPromotions}
                rowKey={(promotion) => promotion.id}
                onRowClick={(promotion) => setSelectedPromotion(promotion)}
                empty={
                  <EmptyState
                    title="No promotion campaigns"
                    description="Create a campaign such as Black Friday 40% Off or Nexa Launch Sale from the reusable building blocks."
                  />
                }
                columns={[
                  {
                    key: "name",
                    label: "Promotion",
                    render: (promotion) => (
                      <div>
                        <p className="font-medium text-ink">{promotion.name}</p>
                        <p className="mt-1 text-xs text-muted">{promotion.code || "Automatic/admin assigned"}</p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (promotion) => <AdminStatusBadge label={promotion.status} tone={statusTone(promotion.status)} />,
                  },
                  { key: "type", label: "Type", render: (promotion) => humanize(promotion.promotionType) },
                  { key: "audience", label: "Target", render: (promotion) => promotion.eligibilityRules?.[0]?.value || "All eligible users" },
                  { key: "start", label: "Start", render: (promotion) => shortDate(promotion.startsAt) },
                  { key: "end", label: "End", render: (promotion) => shortDate(promotion.endsAt) },
                  {
                    key: "redemptions",
                    label: "Redemptions",
                    render: (promotion) => `${promotion.redemptionCount || 0}/${promotion.totalRedemptionLimit || "unlimited"}`,
                  },
                  { key: "revenue", label: "Revenue", render: (promotion) => money(promotion.revenueGenerated || 0) },
                ]}
              />
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Create campaign" subtitle="Save a reusable campaign with separate reward, rule, limit, and schedule records.">
          <form onSubmit={handleCreatePromotion} className="space-y-4">
            <label className="block text-sm font-medium text-ink">
              Internal name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nexa Launch Promotion"
                className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Customer title
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="25% off Nexa Pro"
                className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="Campaign purpose, audience, and offer details."
                className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Type
                <select
                  value={form.promotionType}
                  onChange={(event) => setForm((current) => ({ ...current, promotionType: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  {data.catalog.promotionTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-ink">
                Application
                <select
                  value={form.applicationMode}
                  onChange={(event) => setForm((current) => ({ ...current, applicationMode: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  {data.catalog.applicationModes.map((mode) => (
                    <option key={mode} value={mode}>{humanize(mode)}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  {data.catalog.statuses.map((status) => (
                    <option key={status} value={status}>{humanize(status)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-ink">
                Code
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  placeholder="NEXALAUNCH"
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm uppercase outline-none focus:border-ink"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Reward
                <select
                  value={form.rewardType}
                  onChange={(event) => setForm((current) => ({ ...current, rewardType: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
                >
                  {data.catalog.rewardTypes.map((reward) => (
                    <option key={reward} value={reward}>{humanize(reward)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-ink">
                Reward value
                <input
                  value={form.rewardValue}
                  onChange={(event) => setForm((current) => ({ ...current, rewardValue: event.target.value }))}
                  placeholder="25"
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-ink">
              Eligible plans
              <input
                value={form.eligiblePlans}
                onChange={(event) => setForm((current) => ({ ...current, eligiblePlans: event.target.value }))}
                placeholder="starter,plus,pro"
                className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium text-ink">
                Total limit
                <input value={form.totalRedemptionLimit} onChange={(event) => setForm((current) => ({ ...current, totalRedemptionLimit: event.target.value }))} className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink" />
              </label>
              <label className="block text-sm font-medium text-ink">
                Per user
                <input value={form.perUserLimit} onChange={(event) => setForm((current) => ({ ...current, perUserLimit: event.target.value }))} className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink" />
              </label>
              <label className="block text-sm font-medium text-ink">
                Budget
                <input value={form.budgetLimit} onChange={(event) => setForm((current) => ({ ...current, budgetLimit: event.target.value }))} className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Starts
                <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink" />
              </label>
              <label className="block text-sm font-medium text-ink">
                Ends
                <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-ink" />
              </label>
            </div>
            <AdminButton type="submit" variant="primary" disabled={saving || !form.name}>
              {saving ? "Creating..." : "Create promotion"}
            </AdminButton>
          </form>
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminPanel title="Reward types" subtitle="Campaigns can include multiple rewards.">
          <div className="flex flex-wrap gap-2">
            {data.catalog.rewardTypes.map((reward) => (
              <span key={reward} className="rounded-full border border-line bg-shell px-3 py-1.5 text-xs font-medium text-smoke">{humanize(reward)}</span>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Eligibility rules" subtitle="Target users, plans, usage, referrals, organizations, and account history.">
          <div className="flex flex-wrap gap-2">
            {data.catalog.eligibilityRuleTypes.map((rule) => (
              <span key={rule} className="rounded-full border border-line bg-shell px-3 py-1.5 text-xs font-medium text-smoke">{humanize(rule)}</span>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Abuse controls" subtitle="Denied redemptions should record risk score and rejection reason.">
          <div className="flex flex-wrap gap-2">
            {data.catalog.abuseControls.map((control) => (
              <span key={control} className="rounded-full border border-line bg-shell px-3 py-1.5 text-xs font-medium text-smoke">{humanize(control)}</span>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="mt-6">
        <AdminPanel title="Version-one promotion roadmap" subtitle="Initial release building blocks Nexa should prioritize.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.catalog.initialReleasePromotions.map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-shell p-4 text-sm font-medium text-ink">
                {item}
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <DetailDrawer
        open={Boolean(selectedPromotion)}
        title={selectedPromotion?.name || "Promotion"}
        subtitle={selectedPromotion ? `${humanize(selectedPromotion.promotionType)} - ${selectedPromotion.code || selectedPromotion.applicationMode}` : ""}
        onClose={() => setSelectedPromotion(null)}
      >
        {selectedPromotion ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge label={selectedPromotion.status} tone={statusTone(selectedPromotion.status)} />
              <AdminStatusBadge label={selectedPromotion.applicationMode} tone="info" />
            </div>
            <section className="rounded-3xl border border-line bg-shell p-5">
              <h3 className="font-semibold text-ink">Performance</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="text-sm text-muted">Redemptions: <span className="font-medium text-ink">{selectedPromotion.redemptionCount}</span></p>
                <p className="text-sm text-muted">Unique users: <span className="font-medium text-ink">{selectedPromotion.uniqueUsersReached}</span></p>
                <p className="text-sm text-muted">Revenue: <span className="font-medium text-ink">{money(selectedPromotion.revenueGenerated)}</span></p>
                <p className="text-sm text-muted">Cost: <span className="font-medium text-ink">{money(selectedPromotion.promotionCost)}</span></p>
                <p className="text-sm text-muted">Rejected attempts: <span className="font-medium text-ink">{selectedPromotion.rejectedAttempts}</span></p>
                <p className="text-sm text-muted">Conversion: <span className="font-medium text-ink">{selectedPromotion.conversionRate}%</span></p>
              </div>
            </section>
            <section className="rounded-3xl border border-line bg-shell p-5">
              <h3 className="font-semibold text-ink">Rewards</h3>
              <pre className="mt-3 max-h-52 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(selectedPromotion.rewards || [], null, 2)}</pre>
            </section>
            <section className="rounded-3xl border border-line bg-shell p-5">
              <h3 className="font-semibold text-ink">Eligibility and limits</h3>
              <pre className="mt-3 max-h-52 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify({ eligibilityRules: selectedPromotion.eligibilityRules, limits: selectedPromotion.limits }, null, 2)}</pre>
            </section>
          </div>
        ) : null}
      </DetailDrawer>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
