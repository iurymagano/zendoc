import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Contêiner de página do painel: largura máxima centralizada e o ritmo vertical
 * entre blocos (24px no celular, 32px a partir de `sm`). O respiro lateral e o
 * topo vêm do layout do painel, não daqui.
 * - `default`: leitura e formulários (até 1024px).
 * - `wide`: agenda, listas e tabelas (até 1280px).
 */
export function PageContainer({
  variant = 'default',
  className,
  children,
}: {
  variant?: 'default' | 'wide';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 sm:gap-8',
        variant === 'wide' ? 'max-w-7xl' : 'max-w-5xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
