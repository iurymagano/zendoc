import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Título de seção dentro de uma página: Inter 15px semibold na cor cheia da
 * tinta, descrição opcional logo abaixo e uma ação à direita. Substitui o rótulo
 * mono `// SEÇÃO` (DESIGN.md): nada de caixa-alta nem tracking.
 */
export function SectionHeader({
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading className="text-[0.9375rem] font-semibold leading-snug text-foreground">
          {title}
        </Heading>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
