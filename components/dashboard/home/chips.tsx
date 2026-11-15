import type { AppointmentStatus, BookedVia } from '@/types/database';
import { cn } from '@/lib/utils';
import { STATUS } from '@/components/appointments/status';

const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold';

/** Status sempre em texto: a cor sozinha nunca é a única pista. */
export function StatusChip({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status];
  return <span className={cn(base, s.badge)}>{s.label}</span>;
}

/** De onde veio o atendimento: IA no WhatsApp (faísca), manual ou compromisso pessoal. */
export function OriginChip({ via, personal }: { via: BookedVia; personal: boolean }) {
  if (personal) return <span className={cn(base, 'bg-muted text-foreground')}>Pessoal</span>;
  if (via === 'whatsapp_ai') {
    return (
      <span className={cn(base, 'bg-[var(--success-soft)] text-[var(--success)]')}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--ia-spark)] ring-1 ring-[var(--success)]" />
        IA no WhatsApp
      </span>
    );
  }
  return <span className={cn(base, 'bg-muted text-foreground')}>Manual</span>;
}
