'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Appointment, AppointmentStatus, BookedVia } from '@/types/database';

const TZ = 'America/Sao_Paulo';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  pending_approval: 'Aguardando aprovação',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  scheduled: 'bg-primary/10 text-primary',
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  cancelled: 'bg-muted text-muted-foreground',
  no_show: 'bg-destructive/10 text-destructive',
};

const SOURCE_LABEL: Record<BookedVia, string> = {
  whatsapp_ai: 'IA no WhatsApp',
  manual: 'Manual',
};

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDayHeader(date: Date): string {
  const weekday = format(date, 'EEEE', { locale: ptBR });
  const day = format(date, "dd 'de' MMMM", { locale: ptBR });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${day}`;
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, 'dd')} – ${format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  }
  return `${format(start, "dd 'de' MMM", { locale: ptBR })} – ${format(end, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
}

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(addDays(weekStart, 7), 'yyyy-MM-dd');
      const res = await fetch(`/api/appointments?from=${from}&to=${to}`);
      if (cancelled) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Erro ao carregar agenda.');
        setAppointments([]);
      } else {
        const body = await res.json();
        setAppointments(body.appointments ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const byDay = useMemo(
    () =>
      days.map((day) => ({
        day,
        items: appointments.filter((a) =>
          isSameDay(new Date(a.starts_at), day),
        ),
      })),
    [days, appointments],
  );

  const today = new Date();

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Agenda</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatWeekRange(weekStart)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'outline' })}
            >
              Voltar
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
            >
              ← Semana anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
            >
              Próxima semana →
            </Button>
          </div>
        </header>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="text-sm text-destructive py-4">
              {error}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground py-6">
              Carregando agenda…
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {byDay.map(({ day, items }) => {
              const isToday = isSameDay(day, today);
              return (
                <Card
                  key={day.toISOString()}
                  className={isToday ? 'border-primary/40' : undefined}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {formatDayHeader(day)}
                      {isToday && (
                        <span className="ml-2 text-xs font-normal text-primary">
                          hoje
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {items.length === 0
                        ? 'Sem agendamentos'
                        : `${items.length} agendamento${items.length === 1 ? '' : 's'}`}
                    </CardDescription>
                  </CardHeader>
                  {items.length > 0 && (
                    <CardContent>
                      <ul className="flex flex-col divide-y">
                        {items.map((a) => (
                          <li
                            key={a.id}
                            className={`flex items-center justify-between gap-3 py-3 ${
                              a.status === 'cancelled' ||
                              a.status === 'no_show'
                                ? 'opacity-60'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="tabular-nums">
                                  {formatTime(a.starts_at)} –{' '}
                                  {formatTime(a.ends_at)}
                                </span>
                                <span className="truncate">
                                  {a.patient_name}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {a.patient_phone} · {SOURCE_LABEL[a.booked_via]}
                                {a.notes ? ` · ${a.notes}` : ''}
                                {a.cancellation_note
                                  ? ` · motivo: ${a.cancellation_note}`
                                  : ''}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}
                            >
                              {STATUS_LABEL[a.status]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
