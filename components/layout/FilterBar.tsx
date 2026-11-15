'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Barra de filtros de uma lista: busca à esquerda, filtros (`FilterChip`,
 * Select, Tabs…) ao centro e ações ou contagem à direita. Quebra em linhas no
 * celular; nada de rolagem horizontal escondida.
 */
export function FilterBar({
  search,
  children,
  trailing,
  label = 'Filtros',
  className,
}: {
  search?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {search}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      {trailing && (
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          {trailing}
        </div>
      )}
    </div>
  );
}

/** Filtro liga/desliga em pílula: `Button` shadcn com `aria-pressed`. */
export function FilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
      {count !== undefined && (
        <span className="font-mono text-xs tabular-nums opacity-80">{count}</span>
      )}
    </Button>
  );
}
