'use client';

import type { ComponentType } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  CheckCheck,
  Hourglass,
  MessageCircleWarning,
  MessageSquareX,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/notifications/relative-time';
import { cn } from '@/lib/utils';
import type { AppNotificationItem, NotificationType } from '@/types/database';
import { useNotifications } from './useNotifications';

type Visual = {
  icon: ComponentType<{ className?: string }>;
  /** Fundo + cor do ícone (tokens do DESIGN.md, nunca cor solta). */
  tone: string;
};

const VISUAL: Record<NotificationType, Visual> = {
  appointment_cancelled: { icon: CalendarX2, tone: 'bg-destructive-soft text-destructive' },
  appointment_rescheduled: { icon: CalendarClock, tone: 'bg-accent text-accent-foreground' },
  appointment_booked: { icon: CalendarCheck, tone: 'bg-success-soft text-success' },
  appointment_pending_approval: { icon: Hourglass, tone: 'bg-warning-soft text-warning' },
  appointment_confirmed: { icon: CheckCheck, tone: 'bg-success-soft text-success' },
  appointment_conflict: { icon: TriangleAlert, tone: 'bg-warning-soft text-warning' },
  conversation_attention: { icon: MessageCircleWarning, tone: 'bg-accent text-accent-foreground' },
  whatsapp_disconnected: { icon: WifiOff, tone: 'bg-destructive-soft text-destructive' },
  message_failed: { icon: MessageSquareX, tone: 'bg-destructive-soft text-destructive' },
};

function Row({
  n,
  now,
  onSelect,
}: {
  n: AppNotificationItem;
  now: Date;
  onSelect: (n: AppNotificationItem) => void;
}) {
  const unread = n.read_at === null;
  const { icon: Icon, tone } = VISUAL[n.type] ?? VISUAL.appointment_rescheduled;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(n)}
        className={cn(
          'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left outline-none transition-colors',
          'focus-visible:ring-3 focus-visible:ring-ring/50',
          unread ? 'bg-accent/50 hover:bg-accent' : 'hover:bg-muted',
        )}
      >
        <span
          className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', tone)}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span
              className={cn(
                'text-sm leading-snug text-foreground',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {n.title}
            </span>
            {unread && (
              <>
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--ia-violet-action)]"
                />
                <span className="sr-only">não lida</span>
              </>
            )}
          </span>
          <span className="mt-0.5 block line-clamp-2 text-[13px] leading-snug text-muted-foreground">
            {n.body}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {formatRelativeTime(n.created_at, now)}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * Cabeçalho + lista das notificações. Usado dentro do Popover (desktop) e do
 * Sheet (mobile). `onNavigate` fecha o contêiner depois de um clique.
 */
export function NotificationList({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { items, unreadCount, status, markAllRead, open } = useNotifications();
  const now = new Date();

  function select(n: AppNotificationItem) {
    open(n);
    onNavigate?.();
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1">
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          Notificações
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0}
          onClick={() => void markAllRead()}
          className="text-[var(--ia-violet-ink)]"
        >
          Marcar todas como lidas
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1">
        {status === 'loading' ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          status === 'error' ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar agora. Tentamos de novo em instantes.
            </p>
          ) : (
            <EmptyState
              title="Tudo em dia"
              description="Quando um cliente cancelar, remarcar ou precisar de você, o aviso aparece aqui."
            />
          )
        ) : (
          <ul className="flex flex-col gap-0.5">
            {items.map((n) => (
              <Row key={n.id} n={n} now={now} onSelect={select} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
