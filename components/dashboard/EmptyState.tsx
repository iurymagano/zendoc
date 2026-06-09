import type { ComponentType, ReactNode } from 'react';

/**
 * Estado vazio padronizado: ícone num círculo, título, descrição opcional e um
 * slot de ação (children) — usado em listas sem itens.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
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
