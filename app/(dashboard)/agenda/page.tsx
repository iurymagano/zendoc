'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, addMonths, format, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { UrlParamEffect } from '@/components/dashboard/UrlParamEffect';
import { PageContainer } from '@/components/layout/PageContainer';
import { AgendaToolbar } from '@/components/agenda/AgendaToolbar';
import { AgendaLegend } from '@/components/agenda/AgendaLegend';
import { AgendaSkeleton } from '@/components/agenda/AgendaSkeleton';
import { AppointmentDetails } from '@/components/agenda/AppointmentDetails';
import { AppointmentForm } from '@/components/agenda/AppointmentForm';
import { CalendarMonth } from '@/components/agenda/CalendarMonth';
import { CalendarTimeGrid } from '@/components/agenda/CalendarTimeGrid';
import { DayStrip } from '@/components/agenda/DayStrip';
import { ResponsiveOverlay } from '@/components/agenda/ResponsiveOverlay';
import { useMediaQuery } from '@/components/agenda/useMediaQuery';
import {
  buildAvailability,
  isoToLocal,
  periodLabel,
  rangeFor,
  type View,
} from '@/components/agenda/agenda-utils';
import { BusyEvent, formatTime } from '@/components/agenda/calendar-utils';
import { isPersonalCommitment } from '@/lib/appointments/personal';
import type {
  Appointment,
  AppointmentStatus,
  AvailabilityException,
  AvailabilityWeekly,
  Patient,
  Service,
} from '@/types/database';

const VIEW_PERIOD: Record<View, string> = {
  day: 'neste dia',
  week: 'nesta semana',
  month: 'neste mês',
};

export default function AgendaPage() {
  // No celular o Dia é o padrão (a faixa de 7 dias troca o dia); a escolha manual vale depois.
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [chosenView, setView] = useState<View | null>(null);
  const view: View = chosenView ?? (isMobile ? 'day' : 'week');
  const [cursor, setCursor] = useState(() => new Date());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState<BusyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detalhes e formulário: cada um é uma sobreposição (Dialog no desktop, Sheet no celular).
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [initialStart, setInitialStart] = useState<string | undefined>(undefined);

  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [weekly, setWeekly] = useState<AvailabilityWeekly[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  const { from, to } = useMemo(() => rangeFor(view, cursor), [view, cursor]);
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');

  // Só a resposta da última busca vale (navegar rápido não mistura períodos).
  const requestRef = useRef(0);
  const loadData = useCallback(
    async (silent = false) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      setError(null);
      const [res, exRes] = await Promise.all([
        fetch(`/api/appointments?from=${fromStr}&to=${toStr}`),
        // Só leitura: serve para hachurar o que está fora da rotina.
        fetch(`/api/availability/exceptions?from=${fromStr}&to=${toStr}`).catch(() => null),
      ]);
      if (id !== requestRef.current) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (id !== requestRef.current) return;
        setError(body.error ?? 'Erro ao carregar agenda.');
        setAppointments([]);
        setBusy([]);
      } else {
        const body = await res.json();
        if (id !== requestRef.current) return;
        setAppointments(body.appointments ?? []);
        setBusy(body.googleBusy ?? []);
      }
      if (exRes?.ok) {
        const exBody = await exRes.json().catch(() => ({}));
        if (id === requestRef.current) setExceptions(exBody.exceptions ?? []);
      }
      setLoading(false);
    },
    [fromStr, toStr],
  );

  const loadPatients = useCallback(async () => {
    const res = await fetch('/api/patients');
    if (res.ok) {
      const body = await res.json();
      setPatientsList(body.patients ?? []);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadPatients();
      const res = await fetch('/api/services');
      if (res.ok) {
        const body = await res.json();
        setAllServices((body.services ?? []) as Service[]);
      }
      const wk = await fetch('/api/availability/weekly').catch(() => null);
      if (wk?.ok) {
        const body = await wk.json().catch(() => ({}));
        setWeekly(body.blocks ?? []);
      }
    })();
  }, [loadPatients]);

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  // Auto-sync com o Google: puxa os compromissos pessoais sem o usuário precisar
  // clicar. No dev não há push do Google (precisa de https público), então
  // sincronizamos ao abrir a agenda, ao voltar pra aba e a cada 60s. Em prod o
  // push (watch) já mantém atualizado; isto é um complemento barato.
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  const lastSyncRef = useRef(0);
  const autoSync = useCallback(async () => {
    if (Date.now() - lastSyncRef.current < 30_000) return; // throttle 30s
    lastSyncRef.current = Date.now();
    try {
      const res = await fetch('/api/google/calendar/sync', { method: 'POST' });
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      if (body.connected === false) return; // Google não conectado — ignora
      if ((body.upserted ?? 0) > 0 || (body.removed ?? 0) > 0) {
        await loadDataRef.current(true);
      }
    } catch {
      /* silencioso — auto-sync é best-effort */
    }
  }, []);

  useEffect(() => {
    void autoSync();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void autoSync();
    };
    const interval = setInterval(() => void autoSync(), 60_000);
    window.addEventListener('focus', autoSync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', autoSync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [autoSync]);

  const activeServices = useMemo(() => allServices.filter((s) => s.active), [allServices]);
  const serviceNames = useMemo(
    () => Object.fromEntries(allServices.map((s) => [s.id, s.name])),
    [allServices],
  );
  const availability = useMemo(
    () => buildAvailability(weekly, exceptions),
    [weekly, exceptions],
  );

  // --- abrir/fechar sobreposições -------------------------------------------

  function openCreate(startsLocal?: string) {
    const base = new Date();
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    setEditing(null);
    setInitialStart(startsLocal ?? isoToLocal(base.toISOString()));
    setDetailsOpen(false);
    setFormOpen(true);
  }

  // Atalho ?novo=1: abre o formulário e limpa o parâmetro (recarregar não reabre).
  function openNew(value: string) {
    if (value !== '1') return;
    openCreate();
    const url = new URL(window.location.href);
    url.searchParams.delete('novo');
    url.searchParams.delete('n');
    window.history.replaceState(null, '', url.pathname + url.search);
  }

  function openCreateAt(dateKey: string, hour = 9) {
    openCreate(`${dateKey}T${String(hour).padStart(2, '0')}:00`);
  }

  function openDetails(a: Appointment) {
    setSelected(a);
    setDetailsOpen(true);
  }

  function openEdit(a: Appointment) {
    setEditing(a);
    setInitialStart(undefined);
    setDetailsOpen(false);
    setFormOpen(true);
  }

  async function refreshAfterSave() {
    await Promise.all([loadData(true), loadPatients()]);
    setFormOpen(false);
  }

  // --- ações de status (mesmos endpoints de sempre) --------------------------

  async function stopSeries(a: Appointment) {
    if (!a.recurrence_id) return;
    if (
      !window.confirm(
        'Encerrar esta série? Os atendimentos futuros desta recorrência serão cancelados (os passados permanecem).',
      )
    ) {
      return;
    }
    const res = await fetch(`/api/recurrences/${a.recurrence_id}/stop`, {
      method: 'POST',
    });
    if (res.ok) {
      await loadData(true);
      setDetailsOpen(false);
    }
  }

  async function patchStatus(id: string, status: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadData(true);
      setDetailsOpen(false);
    }
  }

  async function cancel(a: Appointment) {
    const ok = window.confirm(
      `Cancelar agendamento de ${a.patient_name} (${formatTime(a.starts_at)})?`,
    );
    if (!ok) return;
    const reason = window.prompt('Motivo (opcional):') ?? '';
    const res = await fetch(`/api/appointments/${a.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancellation_note: reason.trim() || undefined }),
    });
    if (res.ok) {
      await loadData(true);
      setDetailsOpen(false);
    }
  }

  // --- navegação -------------------------------------------------------------

  function navigate(dir: -1 | 1) {
    setCursor((c) =>
      view === 'month' ? addMonths(c, dir) : addDays(c, dir * (view === 'week' ? 7 : 1)),
    );
  }

  // Vai para o dia (yyyy-MM-dd) pedido pela URL, ignorando valor malformado.
  function openDay(dateKey: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!m) return;
    setCursor(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  }

  // Do mês para a visão Dia (número do dia ou "+N").
  function goToDay(dateKey: string) {
    openDay(dateKey);
    setView('day');
  }

  const days = useMemo(() => {
    if (view === 'day') return [cursor];
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, cursor]);

  const handlers = {
    onEdit: openEdit,
    onSetStatus: patchStatus,
    onCancel: cancel,
    onStopSeries: stopSeries,
  };

  const editingPersonal = !!editing && isPersonalCommitment(editing.patient_phone);
  const empty = !loading && !error && appointments.length === 0;

  return (
    <PageContainer variant="wide" className="gap-4 sm:gap-5">
      {/* Link de notificação: /agenda?date=AAAA-MM-DD abre a agenda nesse dia. */}
      <Suspense fallback={null}>
        <UrlParamEffect name="date" onChange={openDay} />
        {/* /agenda?novo=1 abre o formulário direto (atalho do painel). */}
        <UrlParamEffect name="novo" onChange={openNew} />
      </Suspense>

      <PageHeader
        title="Agenda"
        actions={
          <Button onClick={() => openCreate()}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Novo agendamento
          </Button>
        }
      />

      <AgendaToolbar
        view={view}
        onViewChange={setView}
        label={periodLabel(view, cursor)}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => setCursor(new Date())}
      />

      {view === 'day' && (
        <div className="md:hidden">
          <DayStrip cursor={cursor} appointments={appointments} onSelect={setCursor} />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-destructive-soft px-4 py-3 text-sm text-destructive-ink"
        >
          <span>{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadData()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {loading ? (
        <AgendaSkeleton />
      ) : (
        <>
          {empty && (
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento {VIEW_PERIOD[view]}. Clique em um horário da grade ou
              use “Novo agendamento”.
            </p>
          )}
          {view === 'month' ? (
            <CalendarMonth
              monthCursor={cursor}
              appointments={appointments}
              busy={busy}
              onSelectAppointment={openDetails}
              onSelectDay={(key) => openCreateAt(key)}
              onOpenDay={goToDay}
            />
          ) : (
            <CalendarTimeGrid
              days={days}
              appointments={appointments}
              busy={busy}
              availability={availability}
              serviceNames={serviceNames}
              onSelectAppointment={openDetails}
              onSelectSlot={(key, hour) => openCreateAt(key, hour)}
            />
          )}
          <AgendaLegend showRoutine={view !== 'month' && weekly.length > 0} />
        </>
      )}

      <ResponsiveOverlay
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={selected?.patient_name ?? 'Atendimento'}
        description={
          selected && isPersonalCommitment(selected.patient_phone)
            ? 'Compromisso pessoal'
            : undefined
        }
      >
        {selected && (
          <AppointmentDetails
            appointment={selected}
            serviceName={selected.service_id ? serviceNames[selected.service_id] : undefined}
            handlers={handlers}
          />
        )}
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={formOpen}
        onOpenChange={setFormOpen}
        title={
          editing
            ? editingPersonal
              ? 'Editar compromisso'
              : 'Editar agendamento'
            : 'Novo agendamento'
        }
        description={
          editingPersonal
            ? 'Horários interpretados em America/Sao_Paulo.'
            : 'Horários interpretados em America/Sao_Paulo. Se o cliente já existir (mesmo telefone), seu cadastro é reutilizado.'
        }
      >
        <AppointmentForm
          editing={editing}
          initialStart={initialStart}
          patients={patientsList}
          services={activeServices}
          onCancel={() => setFormOpen(false)}
          onSaved={refreshAfterSave}
        />
      </ResponsiveOverlay>
    </PageContainer>
  );
}
