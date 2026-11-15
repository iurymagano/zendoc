import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types/database';
import { formatTime } from '@/components/agenda/calendar-utils';
import { StatusBadge } from './StatusBadge';

/**
 * Linha de atendimento: horário em mono (dado) à esquerda, nome e detalhe no
 * meio, status e ações à direita. Cancelado fica riscado e esmaecido. Com `href`
 * a linha inteira leva ao detalhe; `actions` fica fora do link.
 * Horário no fuso da agenda (America/Sao_Paulo).
 */
export function AppointmentCard({
  startsAt,
  endsAt,
  title,
  detail,
  status,
  href,
  badges,
  actions,
  className,
}: {
  startsAt: string;
  endsAt?: string;
  title: string;
  /** Linha secundária: serviço, telefone, origem. */
  detail?: ReactNode;
  /** Se informado, mostra o StatusBadge; compromisso pessoal não passa status. */
  status?: AppointmentStatus;
  href?: string;
  /** Chips extras (origem etc.) ao lado do status. */
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const cancelled = status === 'cancelled';
  const main = (
    <>
      <div className="flex w-14 shrink-0 flex-col font-mono text-sm leading-tight tabular-nums">
        <span className="font-medium">{formatTime(startsAt)}</span>
        {endsAt && (
          <span className="text-xs text-muted-foreground">{formatTime(endsAt)}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'truncate text-sm font-semibold',
            cancelled && 'text-muted-foreground line-through',
          )}
        >
          {title}
        </span>
        {detail && (
          <span className="truncate text-xs text-muted-foreground">{detail}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        {badges}
        {status && <StatusBadge status={status} />}
      </div>
    </>
  );
  const row =
    'flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-card)] px-3 py-3 sm:px-4';
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-card)] bg-card transition-colors duration-150',
        actions && 'pr-3',
        href && 'hover:bg-surface-2',
        className,
      )}
    >
      {href ? (
        <Link
          href={href}
          className={cn(row, 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50')}
        >
          {main}
        </Link>
      ) : (
        <div className={row}>{main}</div>
      )}
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
