interface Props {
  current: 1 | 2;
  title: string;
  subtitle?: string;
}

export function StepHeader({ current, title, subtitle }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              n <= current
                ? 'bg-gradient-to-r from-[var(--ia-accent)] to-[var(--ia-accent2)]'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Passo {current} de 2
      </span>
      <div>
        <h1
          className="font-display text-3xl font-semibold tracking-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
