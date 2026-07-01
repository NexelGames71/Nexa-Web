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
  SearchFilterBar,
  StatCard,
  Toast,
  UsageProgress,
} from "./AdminPrimitives";

type Plan = {
  id: string;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  tokens: string;
  images: string;
  voice: string;
  storage: string;
  models: string[];
  paypalPlanId: string;
  status: "public" | "private" | "disabled";
};

type Subscription = {
  id: string;
  customer: string;
  email: string;
  plan: string;
  paypalSubscriptionId: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  currentPeriodEnd: string;
  amount: string;
  failedPayments: number;
  usage: { tokens: number; images: number; voice: number; storage: number };
};

const plans: Plan[] = [
  { id: "starter", name: "Free / Starter", priceMonthly: "$0", priceYearly: "$0", tokens: "25K", images: "10", voice: "15 min", storage: "500 MB", models: ["Fast"], paypalPlanId: "not required", status: "public" },
  { id: "plus", name: "Plus", priceMonthly: "$19", priceYearly: "$190", tokens: "500K", images: "250", voice: "5 hr", storage: "10 GB", models: ["Fast", "Think", "Image"], paypalPlanId: "P-PLUS-SANDBOX", status: "public" },
  { id: "pro", name: "Pro", priceMonthly: "$49", priceYearly: "$490", tokens: "2M", images: "1K", voice: "20 hr", storage: "50 GB", models: ["Fast", "Think", "Deep", "Agent"], paypalPlanId: "P-PRO-SANDBOX", status: "public" },
  { id: "premium", name: "Premium", priceMonthly: "$99", priceYearly: "$990", tokens: "6M", images: "3K", voice: "60 hr", storage: "150 GB", models: ["All premium models"], paypalPlanId: "P-PREMIUM-SANDBOX", status: "private" },
  { id: "business", name: "Business", priceMonthly: "$299", priceYearly: "$2,990", tokens: "25M", images: "10K", voice: "250 hr", storage: "1 TB", models: ["All", "Priority queue"], paypalPlanId: "P-BUSINESS-SANDBOX", status: "public" },
  { id: "enterprise", name: "Enterprise", priceMonthly: "Custom", priceYearly: "Custom", tokens: "Custom", images: "Custom", voice: "Custom", storage: "Custom", models: ["Dedicated routing"], paypalPlanId: "manual contract", status: "private" },
];

const subscriptions: Subscription[] = [
  { id: "sub_001", customer: "Jamiel Brown", email: "jamiel@example.com", plan: "Pro", paypalSubscriptionId: "I-9D8F2NEXA", status: "active", currentPeriodEnd: "2026-07-29", amount: "$49", failedPayments: 0, usage: { tokens: 64, images: 31, voice: 22, storage: 18 } },
  { id: "sub_002", customer: "Ari Chen", email: "ari@example.com", plan: "Business", paypalSubscriptionId: "I-BIZ7NEXA", status: "active", currentPeriodEnd: "2026-07-18", amount: "$299", failedPayments: 0, usage: { tokens: 72, images: 48, voice: 62, storage: 44 } },
  { id: "sub_003", customer: "Maya Carter", email: "maya@example.com", plan: "Plus", paypalSubscriptionId: "I-PLUS31", status: "past_due", currentPeriodEnd: "2026-07-04", amount: "$19", failedPayments: 2, usage: { tokens: 91, images: 88, voice: 54, storage: 37 } },
  { id: "sub_004", customer: "Noah Singh", email: "noah@example.com", plan: "Premium", paypalSubscriptionId: "I-PREM21", status: "trialing", currentPeriodEnd: "2026-07-11", amount: "$99", failedPayments: 0, usage: { tokens: 26, images: 12, voice: 17, storage: 9 } },
];

const revenueTrend = [
  { label: "Jan", value: 8 },
  { label: "Feb", value: 11 },
  { label: "Mar", value: 16 },
  { label: "Apr", value: 24 },
  { label: "May", value: 38 },
  { label: "Jun", value: 57 },
];

function statusTone(status: Subscription["status"] | Plan["status"]) {
  if (status === "active" || status === "public") return "healthy";
  if (status === "trialing" || status === "private") return "info";
  if (status === "past_due" || status === "suspended") return "warning";
  return "danger";
}

export default function AdminBillingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(subscriptions[0]);
  const [confirmSubscription, setConfirmSubscription] = useState<Subscription | null>(null);
  const [toast, setToast] = useState("");

  const filteredSubscriptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subscriptions.filter((subscription) => {
      const matchesSearch =
        !term ||
        [subscription.customer, subscription.email, subscription.plan, subscription.paypalSubscriptionId]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Revenue Operations"
        title="Billing"
        subtitle="Manage Nexa subscriptions, plan limits, PayPal references, payment health, usage pressure, and billing escalations."
        right={
          <>
            <LiveRefreshBadge label="PayPal sync healthy" />
            <AdminButton variant="primary" onClick={() => setToast("PayPal plan creation workflow opened.")}>
              Create plan
            </AdminButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active subscriptions" value={2} note="Plus and above" tone="healthy" />
        <StatCard label="MRR estimate" value={466} note="Sandbox-backed dashboard value" tone="dark" />
        <StatCard label="Failed payments" value={2} note="Needs PayPal sync review" tone="warning" />
        <StatCard label="Trial users" value={1} note="Converting this week" tone="info" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <AdminPanel
          title="Subscription plans"
          subtitle="Plan definitions with limits, model access, and PayPal plan IDs. Production mutation should go through server-only PayPal APIs."
          right={<AdminStatusBadge label="PayPal sandbox ready" tone="info" />}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-3xl border border-line bg-shell p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                    <p className="mt-1 text-sm text-muted">{plan.tokens} tokens • {plan.images} images • {plan.storage}</p>
                  </div>
                  <AdminStatusBadge label={plan.status} tone={statusTone(plan.status)} />
                </div>
                <p className="mt-4 text-3xl font-semibold text-ink">{plan.priceMonthly}<span className="text-sm font-medium text-muted"> / mo</span></p>
                <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                  <p>Yearly: {plan.priceYearly}</p>
                  <p>Voice: {plan.voice}</p>
                  <p className="sm:col-span-2">Models: {plan.models.join(", ")}</p>
                  <p className="sm:col-span-2">PayPal: {plan.paypalPlanId}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <AdminButton variant="secondary" onClick={() => setToast(`${plan.name} editor opened.`)}>Edit</AdminButton>
                  <AdminButton variant="secondary" onClick={() => setToast(`${plan.name} PayPal sync queued.`)}>Sync PayPal</AdminButton>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Revenue trend" subtitle="MRR growth estimate by month.">
            <MiniBarChart data={revenueTrend} tone="dark" />
          </AdminPanel>
          <AdminPanel title="Billing alerts" subtitle="Operational issues to resolve before launch.">
            {[
              ["Failed PayPal payment", "Maya Carter has two failed attempts.", "warning"],
              ["Webhook monitor", "Verify PAYPAL_WEBHOOK_ID in production.", "info"],
              ["High usage", "Plus plan image usage exceeded 80%.", "warning"],
              ["Secrets", "PAYPAL_CLIENT_SECRET must remain server-only.", "healthy"],
            ].map(([title, detail, tone]) => (
              <div key={title} className="mb-3 rounded-2xl border border-line bg-shell p-4 last:mb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{title}</p>
                  <AdminStatusBadge label={String(tone)} tone={tone as any} />
                </div>
                <p className="mt-1 text-sm text-muted">{detail}</p>
              </div>
            ))}
          </AdminPanel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <AdminPanel title="Customers and subscriptions" subtitle="Search, filter, inspect, sync, cancel, or mark billing issues.">
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
                  { value: "active", label: "Active" },
                  { value: "trialing", label: "Trialing" },
                  { value: "past_due", label: "Past due" },
                  { value: "canceled", label: "Canceled" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
            }
          />
          <div className="mt-4">
            <DataTable
              rows={filteredSubscriptions}
              rowKey={(subscription) => subscription.id}
              onRowClick={(subscription) => setSelectedSubscription(subscription)}
              columns={[
                {
                  key: "customer",
                  label: "Customer",
                  render: (subscription) => (
                    <div>
                      <p className="font-semibold text-ink">{subscription.customer}</p>
                      <p className="text-xs text-muted">{subscription.email}</p>
                    </div>
                  ),
                },
                { key: "plan", label: "Plan", render: (subscription) => subscription.plan },
                { key: "paypal", label: "PayPal ID", render: (subscription) => subscription.paypalSubscriptionId },
                { key: "status", label: "Status", render: (subscription) => <AdminStatusBadge label={subscription.status} tone={statusTone(subscription.status)} /> },
                { key: "renewal", label: "Renewal", render: (subscription) => subscription.currentPeriodEnd },
                { key: "amount", label: "Amount", render: (subscription) => subscription.amount },
                { key: "failed", label: "Failed", render: (subscription) => subscription.failedPayments },
              ]}
            />
          </div>
        </AdminPanel>

        <AdminPanel title="PayPal integration" subtitle="Server-only subscription architecture.">
          <div className="space-y-3 text-sm">
            {["Create access token", "Create products/plans", "Start subscription checkout", "Verify webhook signature", "Sync subscription status", "Store transaction references"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-line bg-shell p-3">
                <span className="font-medium text-ink">{item}</span>
                <AdminStatusBadge label="server" tone="healthy" />
              </div>
            ))}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-semibold">Required server env</p>
              <p className="mt-1 text-sm">PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID, PAYPAL_ENV</p>
            </div>
          </div>
        </AdminPanel>
      </div>

      <DetailDrawer
        open={Boolean(selectedSubscription)}
        title={selectedSubscription?.customer || "Subscription"}
        subtitle={selectedSubscription ? `${selectedSubscription.plan} • ${selectedSubscription.paypalSubscriptionId}` : undefined}
        onClose={() => setSelectedSubscription(null)}
      >
        {selectedSubscription ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge label={selectedSubscription.status} tone={statusTone(selectedSubscription.status)} />
              <AdminStatusBadge label={selectedSubscription.amount} tone="dark" />
            </div>
            <AdminPanel title="Usage pressure">
              <div className="space-y-4">
                <UsageProgress label="Text tokens" value={selectedSubscription.usage.tokens} max={100} tone={selectedSubscription.usage.tokens > 85 ? "warning" : "healthy"} />
                <UsageProgress label="Image generations" value={selectedSubscription.usage.images} max={100} tone={selectedSubscription.usage.images > 85 ? "warning" : "healthy"} />
                <UsageProgress label="Voice minutes" value={selectedSubscription.usage.voice} max={100} tone="info" />
                <UsageProgress label="Storage" value={selectedSubscription.usage.storage} max={100} tone="healthy" />
              </div>
            </AdminPanel>
            <AdminPanel title="Payment history">
              <DataTable
                rows={[
                  { id: "pay_1", invoice: "INV-2026-06", transaction: "PAYPAL-91A", amount: selectedSubscription.amount, status: "paid" },
                  { id: "pay_2", invoice: "INV-2026-05", transaction: "PAYPAL-78B", amount: selectedSubscription.amount, status: selectedSubscription.failedPayments ? "failed" : "paid" },
                ]}
                rowKey={(row) => row.id}
                columns={[
                  { key: "invoice", label: "Invoice", render: (row) => row.invoice },
                  { key: "transaction", label: "PayPal", render: (row) => row.transaction },
                  { key: "amount", label: "Amount", render: (row) => row.amount },
                  { key: "status", label: "Status", render: (row) => <AdminStatusBadge label={row.status} tone={row.status === "paid" ? "healthy" : "danger"} /> },
                ]}
              />
            </AdminPanel>
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="primary" onClick={() => setToast("PayPal sync queued.")}>Sync with PayPal</AdminButton>
              <AdminButton variant="secondary" onClick={() => setToast("Plan change workflow opened.")}>Change plan</AdminButton>
              <AdminButton variant="danger" onClick={() => setConfirmSubscription(selectedSubscription)}>Cancel subscription</AdminButton>
            </div>
          </div>
        ) : null}
      </DetailDrawer>

      <ConfirmModal
        open={Boolean(confirmSubscription)}
        title="Cancel subscription?"
        description="Canceling a subscription changes account access and must be recorded in admin audit logs after the backend mutation."
        confirmLabel="Cancel subscription"
        onClose={() => setConfirmSubscription(null)}
        onConfirm={() => {
          setToast(`${confirmSubscription?.customer || "Customer"} cancellation queued for audit.`);
          setConfirmSubscription(null);
        }}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
