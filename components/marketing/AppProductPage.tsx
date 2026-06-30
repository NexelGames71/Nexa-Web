import Link from "next/link";
import AppShell from "./AppShell";

type AppProductPageProps = {
  title: string;
  subtitle: string;
  status?: string;
  highlights: readonly string[];
  steps?: readonly { title: string; body: string }[];
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export default function AppProductPage({
  title,
  subtitle,
  status,
  highlights,
  steps = [],
  primaryCta = { href: "/chat", label: "Open Nexa Chat" },
  secondaryCta = { href: "/signup", label: "Create account" },
}: AppProductPageProps) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <section className="px-5 py-10 pb-16">
        {status ? (
          <p className="mb-6 inline-flex rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-muted">
            {status}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-line bg-panel p-8 shadow-soft">
            <h2 className="text-lg font-semibold">What you get</h2>
            <ul className="mt-5 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-ink">
                  <span className="mt-1 text-muted">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryCta.href}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                {primaryCta.label}
              </Link>
              <Link
                href={secondaryCta.href}
                className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:bg-black/[0.03]"
              >
                {secondaryCta.label}
              </Link>
            </div>
          </article>

          {steps.length > 0 ? (
            <aside className="rounded-3xl border border-line bg-white/60 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">How it works</h2>
              <ol className="mt-4 space-y-4">
                {steps.map((step, index) => (
                  <li key={step.title}>
                    <div className="text-xs font-medium text-muted">Step {index + 1}</div>
                    <div className="mt-1 text-sm font-medium text-ink">{step.title}</div>
                    <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
            </aside>
          ) : (
            <aside className="rounded-3xl border border-dashed border-line bg-panel/50 p-6 text-sm leading-6 text-muted">
              Sign in to use memory, archives, and settings from the same Nexa account you use in chat.
              <Link href="/login" className="mt-4 block font-medium text-ink underline underline-offset-4">
                Log in
              </Link>
            </aside>
          )}
        </div>
      </section>
    </AppShell>
  );
}
