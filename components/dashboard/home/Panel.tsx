import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Rótulo de seção: JetBrains Mono em caixa alta com tracking, precedido de "//". */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true">{'// '}</span>
      {children}
    </p>
  );
}

/**
 * Card do painel inicial: branco sobre a Névoa (o degrau de tom separa, sem
 * linha nem sombra), canto de 28px. Cabeçalho com rótulo mono, título opcional
 * em Sora e uma ação à direita.
 */
export function Panel({
  label,
  title,
  action,
  className,
  children,
}: {
  label: string;
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('gap-5 rounded-[28px] py-6 ring-0', className)}>
      <div className="flex items-start justify-between gap-3 px-5 sm:px-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <SectionLabel>{label}</SectionLabel>
          {title && (
            <h2 className="font-display text-xl font-bold tracking-[-0.03em] sm:text-2xl">
              {title}
            </h2>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex flex-col gap-4 px-5 sm:px-6">{children}</div>
    </Card>
  );
}
