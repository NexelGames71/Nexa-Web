import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function AdminModelsPage() {
  return (
    <AdminPlaceholderPage
      title="Models"
      subtitle="Configure Nexa Fast, Think, and Deep Think availability and limits."
      items={[
        "Enable or disable models per plan",
        "Set rate limits and token caps",
        "Route traffic to inference backends",
        "View model health and latency",
      ]}
    />
  );
}
