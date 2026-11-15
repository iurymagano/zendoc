import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** @deprecated Não é mais exibido (DESIGN.md: sem eyebrow). Remova ao tocar na página. */
  eyebrow?: string;
}

/**
 * Cabeçalho de página do painel: título em Sora 700 (uma linha, até duas no
 * celular), descrição de uma frase em Inter e ações à direita. Sem eyebrow.
 */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.035em] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
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
