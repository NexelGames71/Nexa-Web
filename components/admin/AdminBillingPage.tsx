"use client";

import { useEffect, useMemo, useState } from "react";

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
  SearchFilterBar,
  StatCard,
  Toast,
  UsageProgress,
} from "./AdminPrimitives";

type BillingPlan = {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  paypalProductId: string;
  paypalPlanId: string;
  limits: Record<string, any>;
  features: any[];
  isPublic: boolean;
  status: string;
};

type Subscription = {
  id: string;
  userId: string;
  planId: string;
  paypalSubscriptionId: string;
  status: string;
  renewalDate: string;
  currentPeriodEnd: string;
};

type Payment = {
  id: string;
  userId: string;
  subscriptionId: string;
  paypalTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  failureReason: string;
};

type BillingData = {
  paypal: { configured: boolean; environment: string };
  plans: BillingPlan[];
  subscriptions: Subscription[];
  payments: Payment[];
};

function statusTone(status: string) {
  if (["active", "public", "completed", "paid"].includes(status)) return "healthy";
  if (["trialing", "private", "created"].includes(status)) return "info";
  if (["past_due", "suspended", "failed", "draft"].includes(status)) return "warning";
  if (["canceled", "disabled", "refunded"].includes(status)) return "danger";
  return "neutral";
}

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

async function fetchBilling() {
  const response = await fetch("/api/admin/billing", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to load billing operations.");
  }
  return data as BillingData;
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData>({ paypal: { configured: false, environment: "sandbox" }, plans: [], subscriptions: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [toast, setToast] = useState("");

  async function loadBilling() {
    setLoading(true);
    setError("");
    try {
      const nextData = await fetchBilling();
      setData(nextData);
      setSelectedSubscription((current) => current || nextData.subscriptions[0] || null);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load billing operations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBilling();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.subscriptions.filter((subscription) => {
      const matchesSearch =
        !term ||
        [subscription.userId, subscription.planId, subscription.paypalSubscriptionId]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.subscriptions, search, statusFilter]);

  const activeSubscriptions = data.subscriptions.filter((subscription) => subscription.status === "active").length;
  const failedPayments = data.payments.filter((payment) => ["failed", "denied"].includes(payment.status)).length;
  const revenueThisMonth = data.payments
    .filter((payment) => ["completed", "paid"].includes(payment.status))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const planBars = data.plans.map((plan) => ({
    label: plan.name,
    value: data.subscriptions.filter((subscription) => subscription.planId === plan.id).length,
  }));

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Revenue Operations"
        title="Billing"
        subtitle="Manage Nexa plans, PayPal subscription references, payment health, usage limits, and billing escalations from production records."
        right={
          <>
            <LiveRefreshBadge label={data.paypal.configured ? `PayPal ${data.paypal.environment}` : "PayPal config incomplete"} />
            <AdminButton variant="primary" onClick={() => void loadBilling()}>
              Refresh
            </AdminButton>
          </>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void loadBilling()} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Plans" value={data.plans.length} note="Billing plan records" tone="dark" />
        <StatCard label="Active subscriptions" value={activeSubscriptions} note="Synced from PayPal webhooks" tone="healthy" />
        <StatCard label="Revenue this month" value={revenueThisMonth} note="Completed payments" tone="info" />
        <StatCard label="Failed payments" value={failedPayments} note="Needs billing review" tone={failedPayments ? "warning" : "healthy"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <AdminPanel title="Subscription plans" subtitle="Plan definitions with limits, public status, and PayPal plan IDs.">
          {loading ? (
            <LoadingSkeleton rows={6} />
          ) : data.plans.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.plans.map((plan) => (
                <article key={plan.id} className="rounded-3xl border border-line bg-shell p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                      <p className="mt-1 text-sm text-muted">{plan.paypalPlanId || "No PayPal plan ID set"}</p>
                    </div>
                    <AdminStatusBadge label={plan.status} tone={statusTone(plan.status)} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-ink">{money(plan.priceMonthly, plan.currency)}<span className="text-sm font-medium text-muted"> / mo</span></p>
                  <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                    <p>Yearly: {money(plan.priceYearly, plan.currency)}</p>
                    <p>{plan.isPublic ? "Public" : "Private"}</p>
                    <p className="sm:col-span-2">Features: {Array.isArray(plan.features) && plan.features.length ? plan.features.join(", ") : "No feature list configured"}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No billing plans" description="Create billing plan records and PayPal plan IDs before enabling paid subscriptions." />
          )}
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Plan distribution" subtitle="Active subscriptions by plan.">
            {planBars.length ? <MiniBarChart data={planBars} tone="dark" /> : <EmptyState title="No distribution yet" description="Subscription counts appear after PayPal webhooks create records." />}
          </AdminPanel>
          <AdminPanel title="PayPal integration" subtitle="Server-only billing gateway status.">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-line bg-shell p-3">
                <span className="font-medium text-ink">Environment</span>
                <AdminStatusBadge label={data.paypal.environment || "sandbox"} tone="info" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-line bg-shell p-3">
                <span className="font-medium text-ink">Webhook verification</span>
                <AdminStatusBadge label={data.paypal.configured ? "configured" : "missing"} tone={data.paypal.configured ? "healthy" : "danger"} />
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <AdminPanel title="Customers and subscriptions" subtitle="Search, filter, inspect, and reconcile PayPal subscription state.">
          {loading ? (
            <LoadingSkeleton rows={7} />
          ) : (
            <>
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
                      ...Array.from(new Set(data.subscriptions.map((subscription) => subscription.status))).map((status) => ({
                        value: status,
                        label: status,
                      })),
                    ]}
                  />
                }
              />
              <div className="mt-4">
                <DataTable
                  rows={filteredSubscriptions}
                  rowKey={(subscription) => subscription.id}
                  onRowClick={(subscription) => setSelectedSubscription(subscription)}
                  empty={<EmptyState title="No subscriptions" description="PayPal subscription webhooks will populate this table once customers subscribe." />}
                  columns={[
                    { key: "user", label: "User ID", render: (subscription) => subscription.userId || "Unknown" },
                    { key: "plan", label: "Plan", render: (subscription) => subscription.planId || "Unassigned" },
                    { key: "paypal", label: "PayPal ID", render: (subscription) => subscription.paypalSubscriptionId || "Not linked" },
                    { key: "status", label: "Status", render: (subscription) => <AdminStatusBadge label={subscription.status} tone={statusTone(subscription.status)} /> },
                    { key: "renewal", label: "Renewal", render: (subscription) => subscription.renewalDate || subscription.currentPeriodEnd || "Not set" },
                  ]}
                />
              </div>
            </>
          )}
        </AdminPanel>

        <AdminPanel title="Payments" subtitle="Recent payment records from PayPal events.">
          <DataTable
            rows={data.payments.slice(0, 8)}
            rowKey={(payment) => payment.id}
            empty={<EmptyState title="No payments" description="Completed, denied, and refunded PayPal payment events will appear here." />}
            columns={[
              { key: "id", label: "Transaction", render: (payment) => payment.paypalTransactionId || payment.id },
              { key: "amount", label: "Amount", render: (payment) => money(payment.amount, payment.currency) },
              { key: "status", label: "Status", render: (payment) => <AdminStatusBadge label={payment.status} tone={statusTone(payment.status)} /> },
            ]}
          />
        </AdminPanel>
      </div>

      <DetailDrawer
        open={Boolean(selectedSubscription)}
        title={selectedSubscription?.userId || "Subscription"}
        subtitle={selectedSubscription ? `${selectedSubscription.planId} - ${selectedSubscription.paypalSubscriptionId || "No PayPal ID"}` : undefined}
        onClose={() => setSelectedSubscription(null)}
      >
        {selectedSubscription ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge label={selectedSubscription.status} tone={statusTone(selectedSubscription.status)} />
              <AdminStatusBadge label={selectedSubscription.planId || "unassigned"} tone="dark" />
            </div>
            <AdminPanel title="Subscription details">
              <div className="space-y-3 text-sm text-smoke">
                <p><span className="font-semibold text-ink">User:</span> {selectedSubscription.userId || "Unknown"}</p>
                <p><span className="font-semibold text-ink">PayPal subscription:</span> {selectedSubscription.paypalSubscriptionId || "Not linked"}</p>
                <p><span className="font-semibold text-ink">Renewal:</span> {selectedSubscription.renewalDate || selectedSubscription.currentPeriodEnd || "Not set"}</p>
              </div>
            </AdminPanel>
            <UsageProgress label="Billing record completeness" value={selectedSubscription.paypalSubscriptionId ? 100 : 45} max={100} tone={selectedSubscription.paypalSubscriptionId ? "healthy" : "warning"} />
          </div>
        ) : null}
      </DetailDrawer>

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
