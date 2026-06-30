import Link from "next/link";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: PageHeroProps) {
  return (
    <section className="border-b border-line bg-gradient-to-b from-white to-shell px-5 py-20">
      <div className="mx-auto max-w-4xl text-center">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted md:text-lg">{subtitle}</p>
        ) : null}
        {primaryCta || secondaryCta ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="rounded-full border border-line bg-panel px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
