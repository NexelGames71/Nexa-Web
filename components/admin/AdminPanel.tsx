type AdminPanelProps = {
  id?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function AdminPanel({
  id,
  title,
  subtitle,
  right,
  children,
  className = "",
}: AdminPanelProps) {
  return (
    <section
      id={id}
      className={`rounded-3xl border border-line bg-panel p-6 shadow-soft ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
