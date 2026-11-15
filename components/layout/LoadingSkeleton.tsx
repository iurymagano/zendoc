import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Carregamento com a forma do conteúdo, para a página não pular quando os dados
 * chegam. Anuncia "Carregando" para leitor de tela (`role="status"`).
 * - `list`: linhas de lista (atendimentos, clientes).
 * - `cards`: grade de métricas.
 * - `page`: cabeçalho + cards + lista.
 */
export function LoadingSkeleton({
  variant = 'list',
  rows = 4,
  className,
}: {
  variant?: 'list' | 'cards' | 'page';
  rows?: number;
  className?: string;
}) {
  const list = (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-[var(--radius-card)]" />
      ))}
    </div>
  );
  const cards = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />
      ))}
    </div>
  );
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('flex flex-col gap-6', className)}
    >
      <span className="sr-only">Carregando</span>
      {variant === 'page' && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
      )}
      {(variant === 'cards' || variant === 'page') && cards}
      {(variant === 'list' || variant === 'page') && list}
    </div>
  );
}
