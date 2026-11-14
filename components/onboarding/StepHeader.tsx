interface Props {
  current: 1 | 2;
  title: string;
  subtitle?: string;
}

/** Cabeçalho do onboarding: barra de progresso sólida em violeta, "Passo N de 2" e o título. */
export function StepHeader({ current, title, subtitle }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={current}
        aria-label={`Passo ${current} de 2`}
      >
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              n <= current ? 'bg-[var(--ia-violet-action)]' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-[var(--ia-violet-ink)]">
        Passo {current} de 2
      </span>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.035em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
