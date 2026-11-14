import type { ReactNode } from 'react';

interface Props {
  /** Contexto curto acima do título (ex.: o plano). Texto comum, sem caixa-alta. */
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Cabeçalho de página do painel: título em Sora, descrição em uma frase, ações à direita. */
export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="text-sm font-semibold text-[var(--ia-violet-ink)]">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-base text-muted-foreground">
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
