'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { formatCpf, isValidCpf, maskCpfInput, normalizeCpf } from '@/lib/patients/cpf';
import type {
  Appointment,
  AppointmentStatus,
  BookedVia,
  Patient,
} from '@/types/database';

const TZ = 'America/Sao_Paulo';
const DEFAULT_DURATION_MIN = 50;

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  pending_approval: 'Aguardando aprovação',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  scheduled: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  confirmed:
    'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900/60',
  pending_approval:
    'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-900/60',
  cancelled: 'bg-muted text-muted-foreground ring-1 ring-border',
  no_show: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
};

const SOURCE_LABEL: Record<BookedVia, string> = {
  whatsapp_ai: 'IA no WhatsApp',
  manual: 'Manual',
};

type FormState = {
  patient_name: string;
  patient_phone: string;
  patient_cpf: string;
  starts_local: string;
  ends_local: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  patient_name: '',
  patient_phone: '',
  patient_cpf: '',
  starts_local: '',
  ends_local: '',
  notes: '',
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

function localToISO(local: string): string {
  return `${local}:00-03:00`;
}

function isoToLocal(iso: string): string {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
  return formatted.replace(' ', 'T');
}

function addMinutesToLocal(local: string, minutes: number): string {
  if (!local) return '';
  const d = new Date(localToISO(local));
  d.setMinutes(d.getMinutes() + minutes);
  return isoToLocal(d.toISOString());
}

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  async function loadPatients() {
    const res = await fetch('/api/patients');
    if (res.ok) {
      const body = await res.json();
      setPatientsList(body.patients ?? []);
    }
  }

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const body = await res.json();
        setPatientsList(body.patients ?? []);
      }
    })();
  }, []);

  async function loadWeek(start: Date) {
    setLoading(true);
    setError(null);
    const from = format(start, 'yyyy-MM-dd');
    const to = format(addDays(start, 7), 'yyyy-MM-dd');
    const res = await fetch(`/api/appointments?from=${from}&to=${to}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Erro ao carregar agenda.');
      setAppointments([]);
    } else {
      const body = await res.json();
      setAppointments(body.appointments ?? []);
    }
    setLoading(false);
  }

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
        items: appointments.filter((a) => isSameDay(new Date(a.starts_at), day)),
      })),
    [days, appointments],
  );

  const today = new Date();

  const suggestions = useMemo(() => {
    const rawQuery = form.patient_name.trim().toLowerCase();
    const digits = form.patient_name.replace(/\D/g, '');
    if (!rawQuery && !digits) return patientsList.slice(0, 8);
    return patientsList
      .filter((p) => {
        const matchName = rawQuery && p.name.toLowerCase().includes(rawQuery);
        const matchPhone = digits && p.phone.includes(digits);
        return matchName || matchPhone;
      })
      .slice(0, 8);
  }, [patientsList, form.patient_name]);

  function pickPatient(p: Patient) {
    setForm((prev) => ({
      ...prev,
      patient_name: p.name,
      patient_phone: p.phone,
      patient_cpf: p.cpf ? formatCpf(p.cpf) : '',
    }));
    setSuggestionsOpen(false);
  }

  function openCreate() {
    const base = new Date();
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    const starts = isoToLocal(base.toISOString());
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      starts_local: starts,
      ends_local: addMinutesToLocal(starts, DEFAULT_DURATION_MIN),
    });
    setFormError(null);
    setSuggestionsOpen(false);
    setFormOpen(true);
  }

  function openEdit(a: Appointment) {
    setEditingId(a.id);
    setForm({
      patient_name: a.patient_name,
      patient_phone: a.patient_phone,
      patient_cpf: '',
      starts_local: isoToLocal(a.starts_at),
      ends_local: isoToLocal(a.ends_at),
      notes: a.notes ?? '',
    });
    setFormError(null);
    setSuggestionsOpen(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setSuggestionsOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const phone = form.patient_phone.replace(/\D/g, '');
    if (phone.length < 11 || phone.length > 13) {
      setFormError('Telefone deve ter 11 a 13 dígitos (com DDI e DDD).');
      return;
    }
    if (!form.patient_name.trim()) {
      setFormError('Nome é obrigatório.');
      return;
    }
    if (!form.starts_local || !form.ends_local) {
      setFormError('Defina início e fim do atendimento.');
      return;
    }
    if (form.starts_local >= form.ends_local) {
      setFormError('O horário final precisa ser maior que o inicial.');
      return;
    }
    const cpf = normalizeCpf(form.patient_cpf);
    if (cpf && !isValidCpf(cpf)) {
      setFormError('CPF inválido.');
      return;
    }

    setSaving(true);
    const payload = {
      patient_name: form.patient_name.trim(),
      patient_phone: phone,
      cpf: cpf || null,
      starts_at: localToISO(form.starts_local),
      ends_at: localToISO(form.ends_local),
      notes: form.notes.trim() || null,
    };
    const url = editingId ? `/api/appointments/${editingId}` : '/api/appointments';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setFormError(body.error ?? 'Erro ao salvar agendamento.');
      return;
    }

    await Promise.all([loadWeek(weekStart), loadPatients()]);
    closeForm();
  }

  async function patchStatus(id: string, status: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadWeek(weekStart);
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
    if (res.ok) await loadWeek(weekStart);
  }

  function actionsFor(a: Appointment) {
    if (a.status === 'pending_approval') {
      return (
        <>
          <Button size="sm" onClick={() => patchStatus(a.id, 'scheduled')}>
            Aprovar
          </Button>
          <Button size="sm" variant="outline" onClick={() => cancel(a)}>
            Rejeitar
          </Button>
        </>
      );
    }
    if (a.status === 'scheduled') {
      return (
        <>
          <Button size="sm" variant="outline" onClick={() => patchStatus(a.id, 'confirmed')}>
            Confirmar
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
            Editar
          </Button>
          <Button size="sm" variant="outline" onClick={() => cancel(a)}>
            Cancelar
          </Button>
        </>
      );
    }
    if (a.status === 'confirmed') {
      return (
        <>
          <Button size="sm" variant="outline" onClick={() => patchStatus(a.id, 'no_show')}>
            Não compareceu
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
            Editar
          </Button>
          <Button size="sm" variant="outline" onClick={() => cancel(a)}>
            Cancelar
          </Button>
        </>
      );
    }
    return (
      <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
        Editar
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Agenda"
        title="Sua semana"
        description={formatWeekRange(weekStart)}
        actions={
          <>
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart((d) => addDays(d, -7))}
              >
                ←
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
                }
              >
                Hoje
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart((d) => addDays(d, 7))}
              >
                →
              </Button>
            </div>
            {!formOpen && <Button onClick={openCreate}>Novo agendamento</Button>}
          </>
        }
      />

        {formOpen && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Editar agendamento' : 'Novo agendamento'}
              </CardTitle>
              <CardDescription>
                Horários interpretados em America/Sao_Paulo. Se o paciente já
                existir (mesmo telefone), seu cadastro é reutilizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nome do paciente" htmlFor="ap_name">
                    <div className="relative">
                      <Input
                        id="ap_name"
                        value={form.patient_name}
                        onChange={(e) => {
                          setForm((p) => ({
                            ...p,
                            patient_name: e.target.value,
                          }));
                          setSuggestionsOpen(true);
                        }}
                        onFocus={() => setSuggestionsOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setSuggestionsOpen(false), 150)
                        }
                        autoComplete="off"
                        required
                        maxLength={120}
                      />
                      {suggestionsOpen && suggestions.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-md border bg-popover shadow-md">
                          {suggestions.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickPatient(p)}
                                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                              >
                                <span className="font-medium truncate w-full">
                                  {p.name}
                                </span>
                                <span className="text-xs text-muted-foreground truncate w-full">
                                  {p.phone}
                                  {p.cpf ? ` · ${formatCpf(p.cpf)}` : ''}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {patientsList.length > 0
                        ? `Digite para buscar entre ${patientsList.length} paciente${patientsList.length === 1 ? '' : 's'} já cadastrado${patientsList.length === 1 ? '' : 's'} — se o paciente for novo, ele será criado ao salvar.`
                        : 'Digite nome e telefone — o paciente será criado ao salvar e já aparecerá no cadastro.'}
                    </p>
                  </FormField>
                  <FormField label="Telefone" htmlFor="ap_phone">
                    <Input
                      id="ap_phone"
                      value={form.patient_phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, patient_phone: e.target.value }))
                      }
                      placeholder="5511999998888"
                      required
                    />
                  </FormField>
                  <FormField label="CPF (opcional)" htmlFor="ap_cpf">
                    <Input
                      id="ap_cpf"
                      value={form.patient_cpf}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          patient_cpf: maskCpfInput(e.target.value),
                        }))
                      }
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Início" htmlFor="ap_start">
                    <Input
                      id="ap_start"
                      type="datetime-local"
                      value={form.starts_local}
                      onChange={(e) => {
                        const starts = e.target.value;
                        setForm((p) => ({
                          ...p,
                          starts_local: starts,
                          ends_local:
                            !p.ends_local || p.ends_local <= starts
                              ? addMinutesToLocal(starts, DEFAULT_DURATION_MIN)
                              : p.ends_local,
                        }));
                      }}
                      required
                    />
                  </FormField>
                  <FormField label="Fim" htmlFor="ap_end">
                    <Input
                      id="ap_end"
                      type="datetime-local"
                      value={form.ends_local}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, ends_local: e.target.value }))
                      }
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Anotações (opcional)" htmlFor="ap_notes">
                  <Textarea
                    id="ap_notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    placeholder="Ex.: primeira consulta, encaminhamento, etc."
                  />
                </FormField>

                {formError && (
                  <div className="text-sm text-destructive">{formError}</div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? 'Salvando…'
                      : editingId
                        ? 'Salvar alterações'
                        : 'Criar agendamento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
                  className={
                    isToday
                      ? 'border-primary/40 ring-2 ring-primary/20'
                      : undefined
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {formatDayHeader(day)}
                      {isToday && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-primary">
                          <span className="inline-block h-1 w-1 rounded-full bg-primary" />
                          Hoje
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
                            className={`flex flex-wrap items-center justify-between gap-3 py-3 ${
                              a.status === 'cancelled' || a.status === 'no_show'
                                ? 'opacity-60'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="tabular-nums">
                                  {formatTime(a.starts_at)} – {formatTime(a.ends_at)}
                                </span>
                                <span className="truncate">{a.patient_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {a.patient_phone} · {SOURCE_LABEL[a.booked_via]}
                                {a.notes ? ` · ${a.notes}` : ''}
                                {a.cancellation_note
                                  ? ` · motivo: ${a.cancellation_note}`
                                  : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap shrink-0">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}
                              >
                                {STATUS_LABEL[a.status]}
                              </span>
                              {actionsFor(a)}
                            </div>
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
  );
}
