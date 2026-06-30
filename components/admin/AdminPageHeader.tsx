type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export default function AdminPageHeader({ eyebrow, title, subtitle, right }: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex flex-wrap items-center gap-3">{right}</div> : null}
    </header>
  );
}
