import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Carregamento com a forma da agenda (barra + grade), para a página não pular
 * quando os dados chegam. `toolbar` inclui a barra de período e visão.
 */
export function AgendaSkeleton({
  toolbar = false,
  className,
}: {
  toolbar?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('flex flex-col gap-4', className)}
    >
      <span className="sr-only">Carregando a agenda</span>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-64 max-w-full rounded-full" />
          <Skeleton className="h-10 w-56 rounded-full" />
        </div>
      )}
      <div className="rounded-[var(--radius-card)] bg-card p-3">
        <div className="mb-3 grid grid-cols-[48px_repeat(5,minmax(0,1fr))] gap-2 sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <span />
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton
              key={i}
              className={cn('h-8 rounded-lg', i >= 5 && 'hidden sm:block')}
            />
          ))}
        </div>
        <div className="grid grid-cols-[48px_repeat(5,minmax(0,1fr))] gap-2 sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div className="flex flex-col gap-6 pt-1">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-9" />
            ))}
          </div>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={cn('flex flex-col gap-4', i >= 5 && 'hidden sm:flex')}>
              <Skeleton className="h-12 rounded-md" style={{ marginTop: (i % 3) * 22 }} />
              <Skeleton className="h-16 rounded-md" />
              {i % 2 === 0 && <Skeleton className="h-10 rounded-md" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
