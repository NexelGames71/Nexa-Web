const STATUS_STYLES: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  running: "border-amber-200 bg-amber-50 text-amber-900",
  pending: "border-line bg-sidebar text-muted",
  failed: "border-red-200 bg-red-50 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        STATUS_STYLES[status] || "border-line bg-shell text-muted",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
