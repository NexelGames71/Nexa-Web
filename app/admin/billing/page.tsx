import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function AdminBillingPage() {
  return (
    <AdminPlaceholderPage
      title="Billing"
      subtitle="Subscriptions, invoices, and plan usage."
      items={[
        "Starter, Pro, Premium, and Business plans",
        "Seat management for teams",
        "Stripe invoice history",
        "Usage-based API overages",
      ]}
    />
  );
}
