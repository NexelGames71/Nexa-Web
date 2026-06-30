import AdminPageHeader from "./AdminPageHeader";
import AdminPanel from "./AdminPanel";

type AdminPlaceholderPageProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  items?: string[];
};

export default function AdminPlaceholderPage({
  eyebrow = "Admin",
  title,
  subtitle,
  items = [],
}: AdminPlaceholderPageProps) {
  return (
    <div className="px-5 py-8 sm:px-8">
      <AdminPageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <AdminPanel title="Coming soon" subtitle="This section will use the same data sources as the training overview.">
        <ul className="space-y-2 text-sm text-muted">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-ink">•</span>
              {item}
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
