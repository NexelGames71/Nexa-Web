type AdminMetricCardProps = {
  label: string;
  value: string;
  note?: string;
  icon: React.ReactNode;
};

export default function AdminMetricCard({ label, value, note, icon }: AdminMetricCardProps) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
          {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-shell text-ink">
          {icon}
        </div>
      </div>
    </section>
  );
}
