import {
  CircleCheck,
  CircleX,
  Clock,
  Hourglass,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import type { AppointmentStatus } from '@/types/database';

/**
 * Fonte única do status do atendimento no painel: rótulo, ícone e classes.
 * A cor nunca é a única pista (DESIGN.md): todo status tem texto e ícone, e
 * pendente/cancelado ainda mudam a forma (borda tracejada / riscado).
 * As classes usam os tokens `--status-*` de app/globals.css; as strings ficam
 * literais aqui para o Tailwind enxergá-las.
 */
export interface StatusConfig {
  /** Rótulo curto, igual em chip, legenda e detalhe. */
  label: string;
  /** Frase para tooltip e leitor de tela. */
  description: string;
  icon: LucideIcon;
  /** Pílula (StatusBadge): fundo, texto, borda tracejada ou riscado. */
  badge: string;
  /** Bloco preenchido no calendário. */
  block: string;
  /** Quadradinho da legenda. */
  swatch: string;
}

export const STATUS: Record<AppointmentStatus, StatusConfig> = {
  scheduled: {
    label: 'Agendado',
    description: 'Horário reservado',
    icon: Clock,
    badge: 'bg-status-scheduled-soft text-status-scheduled',
    block:
      'bg-status-scheduled-soft text-status-scheduled ring-1 ring-inset ring-status-scheduled/20 hover:brightness-95',
    swatch: 'bg-status-scheduled-soft ring-1 ring-inset ring-status-scheduled/40',
  },
  confirmed: {
    label: 'Confirmado',
    description: 'O cliente confirmou presença',
    icon: CircleCheck,
    badge: 'bg-status-confirmed-soft text-status-confirmed',
    block:
      'bg-status-confirmed-soft text-status-confirmed ring-1 ring-inset ring-status-confirmed/20 hover:brightness-95',
    swatch: 'bg-status-confirmed-soft ring-1 ring-inset ring-status-confirmed/40',
  },
  pending_approval: {
    label: 'Pendente',
    description: 'Aguardando a sua aprovação',
    icon: Hourglass,
    badge:
      'bg-status-pending-soft text-status-pending border border-dashed border-status-pending/60',
    block:
      'bg-status-pending-soft text-status-pending border border-dashed border-status-pending/60 hover:brightness-95',
    swatch: 'bg-status-pending-soft border border-dashed border-status-pending/60',
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Atendimento cancelado',
    icon: CircleX,
    badge: 'bg-status-cancelled-soft text-status-cancelled line-through',
    block:
      'bg-status-cancelled-soft text-status-cancelled line-through ring-1 ring-inset ring-border hover:brightness-95',
    swatch: 'bg-status-cancelled-soft ring-1 ring-inset ring-border',
  },
  no_show: {
    label: 'Faltou',
    description: 'O cliente não compareceu',
    icon: UserX,
    badge: 'bg-status-noshow-soft text-status-noshow',
    block:
      'bg-status-noshow-soft text-status-noshow ring-1 ring-inset ring-status-noshow/20 hover:brightness-95',
    swatch: 'bg-status-noshow-soft ring-1 ring-inset ring-status-noshow/40',
  },
};

/** Ordem de exibição (legenda, filtros). */
export const STATUS_ORDER: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'pending_approval',
  'cancelled',
  'no_show',
];

export function statusConfig(status: AppointmentStatus): StatusConfig {
  return STATUS[status];
}
