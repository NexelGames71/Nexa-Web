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

type SupportTicket = {
  id: string;
  userId: string;
  user: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  assignedAdmin: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string;
  notes: { id: string; adminId: string; note: string; visibility: string; createdAt: string }[];
};

function statusTone(status: string) {
  if (status === "resolved") return "healthy";
  if (status === "pending") return "warning";
  if (status === "escalated") return "danger";
  if (status === "open") return "info";
  return "neutral";
}

function priorityTone(priority: string) {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "normal") return "info";
  return "neutral";
}

async function fetchSupport() {
  const response = await fetch("/api/admin/support", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to load support operations.");
  }
  return data.items || [];
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [toast, setToast] = useState("");

  async function loadSupport() {
    setLoading(true);
    setError("");
    try {
      const items = await fetchSupport();
      setTickets(items);
      setSelectedTicket((current) => current || items[0] || null);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load support operations.");
    } finally {
      setLoading(false);
    }
  }

  async function applySupportAction(action: "reply" | "note" | "escalate") {
    if (!selectedTicket) return;
    const note =
      action === "reply"
        ? `Admin reply started for ticket ${selectedTicket.id}.`
        : action === "note"
          ? `Internal review note added for ticket ${selectedTicket.id}.`
          : "";

    const response = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.id,
        action,
        note,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setToast(data.error || "Support action failed.");
      return;
    }

    setToast(`Support action saved: ${action}`);
    await loadSupport();
  }

  useEffect(() => {
    void loadSupport();
  }, []);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch =
        !term ||
        [ticket.id, ticket.userId, ticket.email, ticket.subject, ticket.category, ticket.assignedAdmin]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter || ticket.category === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const categoryBars = Object.entries(
    tickets.reduce<Record<string, number>>((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {}),
  ).map(([label, value]) => ({ label, value }));

  return (
    <div className="admin-analytics-page min-h-screen px-5 py-8 sm:px-8">
      <AdminPageHeader
        eyebrow="Support Operations"
        title="Support"
        subtitle="Handle tickets, escalations, customer context, SLA risk, and internal notes from production support records."
        right={
          <>
            <LiveRefreshBadge label={loading ? "Refreshing support" : "Support inbox synced"} />
            <AdminButton variant="primary" onClick={() => void loadSupport()}>
              Refresh
            </AdminButton>
          </>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void loadSupport()} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open tickets" value={tickets.filter((ticket) => ticket.status === "open").length} note="Needs response" tone="info" />
        <StatCard label="Escalated" value={tickets.filter((ticket) => ticket.status === "escalated").length} note="SLA risk queue" tone="danger" />
        <StatCard label="Resolved" value={tickets.filter((ticket) => ticket.status === "resolved").length} note="Completed records" tone="healthy" />
        <StatCard label="Internal notes" value={tickets.reduce((sum, ticket) => sum + ticket.notes.length, 0)} note="Support context entries" tone="dark" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <AdminPanel title="Ticket inbox" subtitle="Search, filter, inspect, assign, escalate, and resolve customer issues.">
          {loading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <>
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
                      ...Array.from(new Set(tickets.flatMap((ticket) => [ticket.status, ticket.category]))).map((value) => ({
                        value,
                        label: value,
                      })),
                    ]}
                  />
                }
              />
              <div className="mt-4">
                <DataTable
                  rows={filteredTickets}
                  rowKey={(ticket) => ticket.id}
                  onRowClick={(ticket) => setSelectedTicket(ticket)}
                  empty={<EmptyState title="No support tickets" description="Support tickets will appear here when customers contact Nexa or when admin workflows create escalation records." />}
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
                    { key: "user", label: "User", render: (ticket) => ticket.email || ticket.userId || "Unknown" },
                    { key: "category", label: "Category", render: (ticket) => ticket.category },
                    { key: "priority", label: "Priority", render: (ticket) => <AdminStatusBadge label={ticket.priority} tone={priorityTone(ticket.priority)} /> },
                    { key: "status", label: "Status", render: (ticket) => <AdminStatusBadge label={ticket.status} tone={statusTone(ticket.status)} pulse={ticket.status === "escalated"} /> },
                    { key: "assigned", label: "Assigned", render: (ticket) => ticket.assignedAdmin || "Unassigned" },
                    { key: "updated", label: "Updated", render: (ticket) => ticket.updatedAt || "Not set" },
                  ]}
                />
              </div>
            </>
          )}
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel title="Support load" subtitle="Ticket categories in the current inbox.">
            {categoryBars.length ? <MiniBarChart data={categoryBars} tone="warning" /> : <EmptyState title="No ticket load" description="Category distribution appears after tickets are created." />}
          </AdminPanel>
          <AdminPanel title="SLA and staffing" subtitle="Operational health from current ticket states.">
            <div className="space-y-4">
              <UsageProgress label="Resolution coverage" value={tickets.length ? Math.round((tickets.filter((ticket) => ticket.status === "resolved").length / tickets.length) * 100) : 0} max={100} tone="healthy" />
              <UsageProgress label="Escalation pressure" value={tickets.length ? Math.round((tickets.filter((ticket) => ticket.status === "escalated").length / tickets.length) * 100) : 0} max={100} tone="warning" />
            </div>
          </AdminPanel>
        </div>
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
              <p className="text-sm leading-6 text-smoke">{selectedTicket.message || "No message body was stored for this ticket."}</p>
            </AdminPanel>
            <AdminPanel title="Customer context">
              <div className="space-y-3 text-sm text-smoke">
                <p><span className="font-semibold text-ink">User ID:</span> {selectedTicket.userId || "Unknown"}</p>
                <p><span className="font-semibold text-ink">Assigned admin:</span> {selectedTicket.assignedAdmin || "Unassigned"}</p>
                <p><span className="font-semibold text-ink">Created:</span> {selectedTicket.createdAt || "Not set"}</p>
                <p><span className="font-semibold text-ink">Resolved:</span> {selectedTicket.resolvedAt || "Not resolved"}</p>
              </div>
            </AdminPanel>
            <AdminPanel title="Internal notes">
              {selectedTicket.notes.length ? (
                <div className="space-y-3">
                  {selectedTicket.notes.map((note) => (
                    <div key={note.id} className="rounded-2xl bg-shell p-4 text-sm text-smoke">
                      <p>{note.note}</p>
                      <p className="mt-2 text-xs text-muted">{note.adminId} - {note.visibility} - {note.createdAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No internal notes" description="Support notes added by admins will appear here with visibility metadata." />
              )}
            </AdminPanel>
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="primary" onClick={() => void applySupportAction("reply")}>Reply</AdminButton>
              <AdminButton variant="secondary" onClick={() => void applySupportAction("note")}>Add note</AdminButton>
              <AdminButton variant="secondary" onClick={() => void applySupportAction("escalate")}>Escalate</AdminButton>
            </div>
          </div>
        ) : null}
      </DetailDrawer>

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}
