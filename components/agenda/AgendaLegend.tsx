import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS, STATUS_ORDER } from '@/components/appointments/status';

/** Legenda da agenda: cada status com ícone e rótulo (lidos de status.ts), mais Google e fora da rotina. */
export function AgendaLegend({ showRoutine }: { showRoutine: boolean }) {
  return (
    <ul
      aria-label="Legenda"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
    >
      {STATUS_ORDER.map((s) => {
        const cfg = STATUS[s];
        const Icon = cfg.icon;
        return (
          <li key={s} className="inline-flex items-center gap-1.5" title={cfg.description}>
            <span className={cn('grid size-5 place-items-center rounded-md', cfg.badge)}>
              <Icon className="size-3" aria-hidden="true" />
            </span>
            {cfg.label}
          </li>
        );
      })}
      <li className="inline-flex items-center gap-1.5">
        <span className="grid size-5 place-items-center rounded-md border border-dashed border-border bg-muted/80">
          <Lock className="size-3" aria-hidden="true" />
        </span>
        Google (pessoal)
      </li>
      {showRoutine && (
        <li className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-5 rounded-md bg-muted/30 ring-1 ring-inset ring-border"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent 0 4px, var(--border) 4px 5px)',
            }}
          />
          Fora da rotina
        </li>
      )}
    </ul>
  );
}
