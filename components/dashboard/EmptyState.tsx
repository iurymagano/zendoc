import type { ComponentType, ReactNode } from 'react';
import { LogoMark } from '@/components/brand/Logo';

/**
 * Estado vazio padronizado: o símbolo da marca (único ornamento), uma frase que
 * convida a agir e um slot de ação (children). `icon` é aceito por compatibilidade
 * com quem já usa o componente, mas não é mais desenhado.
 */
export function EmptyState({
  title,
  description,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <LogoMark
        size={56}
        variant="mono"
        title={null}
        className="text-[var(--ia-void-3)]/20"
      />
      <div>
        <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
