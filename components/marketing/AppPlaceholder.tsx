import Link from "next/link";
import AppShell from "./AppShell";

type AppPlaceholderProps = {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function AppPlaceholder({
  title,
  description,
  ctaHref = "/chat",
  ctaLabel = "Open Nexa Chat",
}: AppPlaceholderProps) {
  return (
    <AppShell title={title} subtitle={description}>
      <section className="px-5 py-10 pb-16">
        <div className="rounded-3xl border border-line bg-panel p-8 text-center shadow-soft">
          <p className="text-sm leading-6 text-muted">
            This area is wired into the Nexa platform roadmap. Core chat, memory, and settings are live
            today — sign in to use the full workspace.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={ctaHref}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white"
            >
              {ctaLabel}
            </Link>
            <Link href="/login" className="rounded-full border border-line px-5 py-2.5 text-sm">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
