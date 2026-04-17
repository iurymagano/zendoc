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
            className={`h-1.5 flex-1 rounded-full ${
              n <= current ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">Passo {current} de 2</div>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
