import type { AppointmentStatus, BookedVia } from '@/types/database';
import { cn } from '@/lib/utils';

const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold';

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  scheduled: { label: 'Agendado', cls: 'bg-accent text-accent-foreground' },
  confirmed: { label: 'Confirmado', cls: 'bg-[var(--success-soft)] text-[var(--success)]' },
  pending_approval: { label: 'Aguarda aprovação', cls: 'bg-[var(--warning-soft)] text-[var(--warning)]' },
  no_show: { label: 'Faltou', cls: 'bg-[var(--destructive-soft)] text-destructive' },
  cancelled: { label: 'Cancelado', cls: 'bg-muted text-muted-foreground line-through' },
};

/** Status sempre em texto: a cor sozinha nunca é a única pista. */
export function StatusChip({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status];
  return <span className={cn(base, s.cls)}>{s.label}</span>;
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
