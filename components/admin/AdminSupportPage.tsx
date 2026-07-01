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

type TicketStatus = "open" | "pending" | "resolved" | "escalated";
type TicketPriority = "low" | "normal" | "high" | "urgent";

type SupportTicket = {
  id: string;
  user: string;
  email: string;
  subject: string;
  message: string;
  category: "billing" | "technical" | "account" | "enterprise";
  priority: TicketPriority;
  status: TicketStatus;
  assignedAdmin: string;
  createdAt: string;
  updatedAt: string;
  slaMinutes: number;
  plan: string;
  subscriptionStatus: string;
  recentErrors: string[];
};

const tickets: SupportTicket[] = [
  {
    id: "SUP-1042",
    user: "Maya Carter",
    email: "maya@example.com",
    subject: "Payment failed but account still shows Plus",
    message: "PayPal says my card failed, but Nexa still lets me generate images. I need to update billing before renewal.",
    category: "billing",
    priority: "high",
    status: "open",
    assignedAdmin: "Billing Ops",
    createdAt: "2026-07-01 18:12",
    updatedAt: "2026-07-01 20:48",
    slaMinutes: 42,
    plan: "Plus",
    subscriptionStatus: "past_due",
    recentErrors: ["PAYMENT.SALE.DENIED", "quota_warning.images"],
  },
  {
    id: "SUP-1041",
    user: "Ari Chen",
    email: "ari@example.com",
    subject: "Image generation stuck at 66 percent",
    message: "The design card keeps animating and never resolves. It happened twice from the hosted beta.",
    category: "technical",
    priority: "urgent",
    status: "escalated",
    assignedAdmin: "Model Ops",
    createdAt: "2026-07-01 17:30",
    updatedAt: "2026-07-01 20:55",
    slaMinutes: -8,
    plan: "Business",
    subscriptionStatus: "active",
    recentErrors: ["R2_USER_STORAGE_BUCKET_NAME missing", "image_job.poll_timeout"],
  },
  {
    id: "SUP-1039",
    user: "Noah Singh",
    email: "noah@example.com",
    subject: "Need export of conversations",
    message: "Please help me export account data for compliance review.",
    category: "account",
    priority: "normal",
    status: "pending",
    assignedAdmin: "Support",
    createdAt: "2026-07-01 13:09",
    updatedAt: "2026-07-01 15:40",
    slaMinutes: 210,
    plan: "Premium",
    subscriptionStatus: "trialing",
    recentErrors: [],
  },
  {
    id: "SUP-1035",
    user: "Jamiel Brown",
    email: "jamiel@example.com",
    subject: "Enterprise security questionnaire",
    message: "We need browser automation permissions, audit logs, and model routing documentation.",
    category: "enterprise",
    priority: "high",
    status: "resolved",
    assignedAdmin: "Enterprise",
    createdAt: "2026-06-30 09:25",
    updatedAt: "2026-07-01 10:15",
    slaMinutes: 0,
    plan: "Pro",
    subscriptionStatus: "active",
    recentErrors: ["audit_log.missing_export"],
  },
];

const ticketLoad = [
  { label: "Billing", value: 18 },
  { label: "Technical", value: 31 },
  { label: "Account", value: 12 },
  { label: "Enterprise", value: 8 },
];

function statusTone(status: TicketStatus) {
  if (status === "resolved") return "healthy";
  if (status === "pending") return "warning";
  if (status === "escalated") return "danger";
  return "info";
}

function priorityTone(priority: TicketPriority) {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "normal") return "info";
  return "neutral";
}

export default function AdminSupportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(tickets[0]);
  const [confirmTicket, setConfirmTicket] = useState<SupportTicket | null>(null);
  const [toast, setToast] = useState("");

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch =
        !term ||
        [ticket.id, ticket.user, ticket.email, ticket.subject, ticket.category, ticket.assignedAdmin]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter || ticket.category === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Support Operations"
        title="Support"
        subtitle="Handle tickets, escalations, billing issues, customer context, SLA risk, and internal notes from a focused operations inbox."
        right={
          <>
            <LiveRefreshBadge label="SLA monitor live" />
            <AdminButton variant="primary" onClick={() => setToast("New ticket composer opened.")}>
              New ticket
            </AdminButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open tickets" value={tickets.filter((ticket) => ticket.status === "open").length} note="Needs response" tone="info" />
        <StatCard label="Escalated" value={tickets.filter((ticket) => ticket.status === "escalated").length} note="SLA risk queue" tone="danger" />
        <StatCard label="Resolved" value={tickets.filter((ticket) => ticket.status === "resolved").length} note="Last 24 hours" tone="healthy" />
        <StatCard label="Avg response" value={36} note="minutes" tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <AdminPanel title="Ticket inbox" subtitle="Search, filter, inspect, assign, escalate, and resolve customer issues.">
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            filters={
              <FilterSelect
                label="Queue"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All queues" },
                  { value: "open", label: "Open" },
                  { value: "pending", label: "Pending" },
                  { value: "resolved", label: "Resolved" },
                  { value: "escalated", label: "Escalated" },
                  { value: "billing", label: "Billing" },
                  { value: "technical", label: "Technical" },
                  { value: "account", label: "Account" },
                  { value: "enterprise", label: "Enterprise" },
                ]}
              />
            }
          />
          <div className="mt-4">
            <DataTable
              rows={filteredTickets}
              rowKey={(ticket) => ticket.id}
              onRowClick={(ticket) => setSelectedTicket(ticket)}
              columns={[
                {
                  key: "ticket",
                  label: "Ticket",
                  render: (ticket) => (
                    <div>
                      <p className="font-semibold text-ink">{ticket.id}</p>
                      <p className="max-w-xs truncate text-xs text-muted">{ticket.subject}</p>
                    </div>
                  ),
                },
                {
                  key: "user",
                  label: "User",
                  render: (ticket) => (
                    <div>
                      <p className="font-medium text-ink">{ticket.user}</p>
                      <p className="text-xs text-muted">{ticket.email}</p>
                    </div>
                  ),
                },
                { key: "category", label: "Category", render: (ticket) => ticket.category },
                { key: "priority", label: "Priority", render: (ticket) => <AdminStatusBadge label={ticket.priority} tone={priorityTone(ticket.priority)} /> },
                { key: "status", label: "Status", render: (ticket) => <AdminStatusBadge label={ticket.status} tone={statusTone(ticket.status)} pulse={ticket.status === "escalated"} /> },
                { key: "assigned", label: "Assigned", render: (ticket) => ticket.assignedAdmin },
                {
                  key: "sla",
                  label: "SLA",
                  render: (ticket) => (
                    <span className={ticket.slaMinutes < 0 ? "font-semibold text-red-700" : "text-smoke"}>
                      {ticket.slaMinutes < 0 ? `${Math.abs(ticket.slaMinutes)}m breached` : `${ticket.slaMinutes}m left`}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Support load" subtitle="Ticket categories this week.">
            <MiniBarChart data={ticketLoad} tone="warning" />
          </AdminPanel>
          <AdminPanel title="SLA and staffing" subtitle="Live support health.">
            <div className="space-y-4">
              <UsageProgress label="SLA compliance" value={91} max={100} tone="healthy" />
              <UsageProgress label="Escalation capacity" value={64} max={100} tone="warning" />
              <UsageProgress label="Enterprise load" value={38} max={100} tone="info" />
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminPanel title="Customer context" subtitle="Signals shown alongside every ticket.">
          {["Current plan", "Subscription status", "Usage level", "Recent errors", "Last login", "Consent status", "Support history"].map((item) => (
            <div key={item} className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-shell p-3 last:mb-0">
              <span className="text-sm font-medium text-ink">{item}</span>
              <AdminStatusBadge label="visible" tone="healthy" />
            </div>
          ))}
        </AdminPanel>
        <AdminPanel title="Issue types" subtitle="Operational categories to prioritize.">
          {[
            ["Billing", "Failed PayPal payments and plan sync"],
            ["Technical", "Image jobs, model latency, browser workflows"],
            ["Account", "Exports, deletion, verification"],
            ["Enterprise", "Security reviews and audit evidence"],
          ].map(([title, detail]) => (
            <div key={title} className="mb-3 rounded-2xl border border-line bg-shell p-4 last:mb-0">
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-muted">{detail}</p>
            </div>
          ))}
        </AdminPanel>
        <AdminPanel title="Support actions" subtitle="All actions require authorization and audit logging.">
          <div className="grid gap-2">
            {["Reply", "Add internal note", "Assign ticket", "Escalate", "Mark resolved", "Link conversation", "Link billing profile", "Create follow-up task"].map((action) => (
              <AdminButton key={action} variant="secondary" onClick={() => setToast(`${action} workflow opened.`)}>
                {action}
              </AdminButton>
            ))}
          </div>
        </AdminPanel>
      </div>

      <DetailDrawer
        open={Boolean(selectedTicket)}
        title={selectedTicket?.id || "Ticket"}
        subtitle={selectedTicket?.subject}
        onClose={() => setSelectedTicket(null)}
      >
        {selectedTicket ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge label={selectedTicket.status} tone={statusTone(selectedTicket.status)} />
              <AdminStatusBadge label={selectedTicket.priority} tone={priorityTone(selectedTicket.priority)} />
              <AdminStatusBadge label={selectedTicket.category} tone="info" />
            </div>
            <AdminPanel title="Customer message">
              <p className="text-sm leading-6 text-smoke">{selectedTicket.message}</p>
            </AdminPanel>
            <AdminPanel title="Customer context">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-shell p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Plan</p>
                  <p className="mt-2 font-semibold text-ink">{selectedTicket.plan}</p>
                </div>
                <div className="rounded-2xl border border-line bg-shell p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Subscription</p>
                  <p className="mt-2 font-semibold text-ink">{selectedTicket.subscriptionStatus}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-line bg-shell p-4">
                <p className="text-sm font-semibold text-ink">Recent errors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTicket.recentErrors.length > 0 ? (
                    selectedTicket.recentErrors.map((error) => <AdminStatusBadge key={error} label={error} tone="warning" />)
                  ) : (
                    <span className="text-sm text-muted">No recent errors.</span>
                  )}
                </div>
              </div>
            </AdminPanel>
            <AdminPanel title="Conversation history">
              <div className="space-y-3">
                <div className="rounded-2xl bg-shell p-4 text-sm text-smoke">User reported: {selectedTicket.subject}</div>
                <div className="rounded-2xl bg-sidebar p-4 text-sm text-smoke">Internal note: review related billing/model logs before replying.</div>
              </div>
            </AdminPanel>
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="primary" onClick={() => setToast("Reply composer opened.")}>Reply</AdminButton>
              <AdminButton variant="secondary" onClick={() => setToast("Internal note added to draft.")}>Add note</AdminButton>
              <AdminButton variant="secondary" onClick={() => setToast("Ticket escalated to owner queue.")}>Escalate</AdminButton>
              <AdminButton variant="danger" onClick={() => setConfirmTicket(selectedTicket)}>Block abusive user</AdminButton>
            </div>
          </div>
        ) : null}
      </DetailDrawer>

      <ConfirmModal
        open={Boolean(confirmTicket)}
        title="Block user?"
        description="Blocking a user affects account access and must be reserved for abuse or safety issues. This action should be logged with admin metadata."
        confirmLabel="Block user"
        onClose={() => setConfirmTicket(null)}
        onConfirm={() => {
          setToast(`${confirmTicket?.user || "User"} block action queued for audit.`);
          setConfirmTicket(null);
        }}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
