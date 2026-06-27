interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-trust">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-bold text-ink md:text-4xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
    </section>
  );
}
