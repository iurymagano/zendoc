import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
