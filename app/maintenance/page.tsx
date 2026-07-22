import type { Metadata } from "next";
import { getConfiguredMaintenanceUntil } from "../../lib/maintenance-window";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Nexa is under maintenance",
  description:
    "Nexa is temporarily offline while maintenance is in progress.",
  robots: {
    index: false,
    follow: false,
  },
};

type MaintenancePageProps = {
  searchParams?: {
    until?: string;
  };
};

function formatMaintenanceEnd(value?: string) {
  if (!value) {
    return "shortly";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "shortly";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  const configuredUntil =
    searchParams?.until || getConfiguredMaintenanceUntil();
  const expectedBack = formatMaintenanceEnd(configuredUntil);

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-semibold">
              N
            </div>
            <div>
              <p className="text-sm font-medium text-white">Nexa AI</p>
              <p className="text-xs text-white/55">Scheduled maintenance</p>
            </div>
          </div>

          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-cyan-200">
            Maintenance in progress
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
            We are tuning Nexa for a better experience.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Nexa Web is temporarily unavailable while we complete planned
            maintenance. Your account data, workspace history, and files remain
            protected during this window.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                Expected back
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {expectedBack}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                Status
              </p>
              <p className="mt-3 text-lg font-semibold text-cyan-200">
                Systems updating
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
