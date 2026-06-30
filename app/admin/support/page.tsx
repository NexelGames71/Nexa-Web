import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function AdminSupportPage() {
  return (
    <AdminPlaceholderPage
      title="Support"
      subtitle="Tickets, escalations, and customer context."
      items={[
        "Open and resolved tickets",
        "Link conversations to support cases",
        "Internal notes on accounts",
        "SLA tracking for Enterprise",
      ]}
    />
  );
}
