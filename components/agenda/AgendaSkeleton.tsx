import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { View } from '@/components/agenda/agenda-utils';

/**
 * Carregamento com a forma da agenda (barra + grade), para a página não pular
 * quando os dados chegam. `toolbar` inclui a barra de período e visão.
 *
 * `view` acompanha a visão ativa: Dia = 1 coluna, Semana = 7, Mês = 6 linhas de 7.
 * `auto` (usado no loading.tsx da rota, que não sabe a visão) segue o padrão da
 * página: Dia no celular (< md) e Semana de md para cima. A altura da grade é a
 * mesma da real (CalendarTimeGrid), então nada pula na troca.
 */
export function AgendaSkeleton({
  toolbar = false,
  view = 'auto',
  className,
}: {
  toolbar?: boolean;
  view?: View | 'auto';
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" className={cn('flex flex-col gap-4', className)}>
      <span className="sr-only">Carregando a agenda</span>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-64 max-w-full rounded-full" />
          <Skeleton className="h-10 w-56 rounded-full" />
        </div>
      )}
      {view === 'month' ? <MonthSkeleton /> : <TimeGridSkeleton view={view} />}
    </div>
  );
}

function TimeGridSkeleton({ view }: { view: 'day' | 'week' | 'auto' }) {
  const cols = view === 'day' ? 1 : 7;
  const template =
    view === 'auto'
      ? 'grid-cols-[48px_minmax(0,1fr)] md:grid-cols-[56px_repeat(7,minmax(0,1fr))]'
      : view === 'day'
        ? 'grid-cols-[48px_minmax(0,1fr)] md:grid-cols-[56px_minmax(0,1fr)]'
        : 'grid-cols-[48px_repeat(5,minmax(0,1fr))] sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]';
  // Dia mostra o cabeçalho só de md para cima (no celular a faixa de 7 dias faz esse papel).
  const headerClass =
    view === 'day' || view === 'auto' ? 'hidden md:grid' : 'grid';
  const hideCol = (i: number) => {
    if (view === 'day') return false;
    if (view === 'auto') return i > 0 && 'hidden md:block';
    return i >= 5 && 'hidden sm:block';
  };

  return (
    <div className="h-[min(46rem,calc(100dvh-15rem))] min-h-[22rem] overflow-hidden rounded-[var(--radius-card)] bg-card">
      <div className={cn('gap-2 border-b border-border p-2', template, headerClass)}>
        <span />
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className={cn('h-8 rounded-lg', hideCol(i))} />
        ))}
      </div>
      <div className={cn('grid gap-2 p-2', template)}>
        <div className="flex flex-col gap-[42px] pt-1">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-9" />
          ))}
        </div>
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className={cn('flex flex-col gap-4', hideCol(i))}>
            <Skeleton className="h-12 rounded-md" style={{ marginTop: (i % 3) * 22 }} />
            <Skeleton className="h-16 rounded-md" />
            {i % 2 === 0 && <Skeleton className="h-10 rounded-md" />}
            <Skeleton className="h-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-card">
      <div className="grid grid-cols-7 gap-1 border-b border-border p-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="mx-auto h-4 w-8" />
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-[92px] flex-col gap-1.5 border-b border-l border-border/60 p-1.5 sm:min-h-[120px] [&:nth-child(7n+1)]:border-l-0"
          >
            <Skeleton className="size-5 rounded-full" />
            {i % 3 !== 2 && <Skeleton className="h-4 rounded-md" />}
          </div>
        ))}
      </div>
    </div>
  );
}
