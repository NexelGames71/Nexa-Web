"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tone = "neutral" | "healthy" | "warning" | "danger" | "info" | "dark";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line bg-sidebar text-muted",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  dark: "border-ink bg-ink text-white",
};

export function AdminButton({
  children,
  onClick,
  disabled = false,
  variant = "secondary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "border-ink bg-ink text-white hover:-translate-y-0.5 hover:shadow-md",
    secondary: "border-line bg-panel text-ink hover:-translate-y-0.5 hover:bg-white hover:shadow-soft",
    danger: "border-red-200 bg-red-50 text-red-700 hover:-translate-y-0.5 hover:bg-red-100",
    ghost: "border-transparent bg-transparent text-muted hover:bg-sidebar hover:text-ink",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function AdminStatusBadge({
  label,
  tone = "neutral",
  pulse = false,
}: {
  label: string;
  tone?: Tone;
  pulse?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        toneClasses[tone],
      ].join(" ")}
    >
      {pulse ? <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {label}
    </span>
  );
}

export function LiveRefreshBadge({
  paused,
  label,
}: {
  paused?: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-smoke shadow-soft">
      <span
        className={[
          "h-2 w-2 rounded-full",
          paused ? "bg-amber-400" : "admin-pulse-dot bg-emerald-500",
        ].join(" ")}
      />
      {label}
    </span>
  );
}

export function useCountUp(value: number, duration = 650) {
  const [display, setDisplay] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = previousRef.current;
    const delta = value - from;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previousRef.current = value;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return display;
}

export function StatCard({
  label,
  value,
  note,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: number | string;
  note?: string;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  const numeric = typeof value === "number" ? value : Number.NaN;
  const animatedValue = useCountUp(Number.isFinite(numeric) ? numeric : 0);
  const display = Number.isFinite(numeric) ? animatedValue : value;
  const formatted =
    typeof display === "number"
      ? display.toLocaleString(undefined, { maximumFractionDigits: display > 100 ? 0 : 1 })
      : display;

  return (
    <section className="admin-fade-up rounded-3xl border border-line bg-panel p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{formatted}</p>
          {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
        </div>
        <div className={["inline-flex h-12 w-12 items-center justify-center rounded-2xl border", toneClasses[tone]].join(" ")}>
          {icon || <span className="h-2.5 w-2.5 rounded-full bg-current" />}
        </div>
      </div>
    </section>
  );
}

export function SearchFilterBar({
  search,
  onSearch,
  filters,
}: {
  search: string;
  onSearch: (value: string) => void;
  filters?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-shell p-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative flex-1">
        <span className="sr-only">Search</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search records"
          className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
      </label>
      {filters ? <div className="flex flex-wrap gap-2">{filters}</div> : null}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function UsageProgress({
  label,
  value,
  max,
  tone = "healthy",
}: {
  label: string;
  value: number;
  max: number;
  tone?: Tone;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const bar = tone === "danger" ? "bg-red-500" : tone === "warning" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-muted">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sidebar">
        <div className={`admin-progress-fill h-full rounded-full ${bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function MiniBarChart({
  data,
  tone = "dark",
}: {
  data: { label: string; value: number }[];
  tone?: Tone;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const color = tone === "danger" ? "bg-red-500" : tone === "warning" ? "bg-amber-500" : tone === "info" ? "bg-sky-500" : "bg-ink";
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((point, index) => (
        <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-full bg-sidebar">
            <div
              className={`admin-bar-rise w-full rounded-full ${color}`}
              style={{ height: `${Math.max(8, (point.value / max) * 100)}%`, animationDelay: `${index * 45}ms` }}
              title={`${point.label}: ${point.value}`}
            />
          </div>
          <span className="max-w-full truncate text-[11px] text-muted">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniLineChart({
  data,
  tone = "dark",
}: {
  data: { label: string; value: number }[];
  tone?: Tone;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const min = Math.min(...data.map((point) => point.value), 0);
  const range = Math.max(max - min, 1);
  const points = useMemo(
    () =>
      data
        .map((point, index) => {
          const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - min) / range) * 86 - 7;
          return `${x},${y}`;
        })
        .join(" "),
    [data, min, range],
  );
  const stroke = tone === "danger" ? "#dc2626" : tone === "warning" ? "#d97706" : tone === "info" ? "#0284c7" : "#0d0d0d";

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-full overflow-visible" role="img" aria-label="Trend chart">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="admin-draw-line" />
      {data.map((point, index) => {
        const [x, y] = points.split(" ")[index]?.split(",").map(Number) || [0, 0];
        return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="2" fill={stroke} />;
      })}
    </svg>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
}: {
  columns: { key: string; label: string; render: (row: T) => React.ReactNode; className?: string }[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return <>{empty || <EmptyState title="No records" description="No matching records are available yet." />}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`border-b border-line px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted ${column.className || ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={["transition hover:bg-sidebar", onRowClick ? "cursor-pointer" : ""].join(" ")}
            >
              {columns.map((column) => (
                <td key={column.key} className={`border-b border-line px-3 py-3 align-top ${column.className || ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailDrawer({
  title,
  subtitle,
  open,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="admin-fade-up ml-auto flex h-full w-full max-w-xl flex-col border-l border-line bg-panel shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <AdminButton variant="ghost" onClick={onClose}>
            Close
          </AdminButton>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/20 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="admin-fade-up w-full max-w-md rounded-3xl border border-line bg-panel p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-shell p-8 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
      <p className="text-sm font-semibold">Request failed</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry ? (
        <div className="mt-4">
          <AdminButton variant="secondary" onClick={onRetry}>
            Retry
          </AdminButton>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-2xl bg-sidebar" />
      ))}
    </div>
  );
}

export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 2800);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-line bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl">
      {message}
    </div>
  );
}
