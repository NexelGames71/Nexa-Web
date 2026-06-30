type SectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Section({ title, subtitle, children, className = "" }: SectionProps) {
  return (
    <section className={`px-5 py-16 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-3 text-sm leading-6 text-muted md:text-base">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
