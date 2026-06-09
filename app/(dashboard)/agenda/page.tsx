'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CalendarMonth } from '@/components/agenda/CalendarMonth';
import { CalendarWeek } from '@/components/agenda/CalendarWeek';
import {
  BusyEvent,
  STATUS_LABEL,
  TZ,
  formatTime,
} from '@/components/agenda/calendar-utils';
import { formatCpf, isValidCpf, maskCpfInput, normalizeCpf } from '@/lib/patients/cpf';
import type { Appointment, AppointmentStatus, Patient } from '@/types/database';

const DEFAULT_DURATION_MIN = 50;
type View = 'month' | 'week';

type Repeat = 'none' | 'weekly' | 'biweekly';

// base-ui Select usa `items` p/ mapear value → rótulo exibido no gatilho.
const REPEAT_ITEMS: Record<Repeat, string> = {
  none: 'Não repete',
  weekly: 'Toda semana',
  biweekly: 'A cada 2 semanas',
};

type FormState = {
  patient_name: string;
  patient_phone: string;
  patient_cpf: string;
  starts_local: string;
  ends_local: string;
  notes: string;
  repeat: Repeat;
  until: string;
};

const EMPTY_FORM: FormState = {
  patient_name: '',
  patient_phone: '',
  patient_cpf: '',
  starts_local: '',
  ends_local: '',
  notes: '',
  repeat: 'none',
  until: '',
};

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

function rangeFor(view: View, cursor: Date): { from: Date; to: Date } {
  if (view === 'week') {
    const from = startOfWeek(cursor, { weekStartsOn: 1 });
    return { from, to: addDays(from, 7) };
  }
  const from = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = startOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  return { from, to: addDays(gridEnd, 7) };
}

export default function AgendaPage() {
  const [view, setView] = useState<View>('week');
  const [cursor, setCursor] = useState(() => new Date());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState<BusyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const { from, to } = useMemo(() => rangeFor(view, cursor), [view, cursor]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');
    const res = await fetch(`/api/appointments?from=${fromStr}&to=${toStr}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Erro ao carregar agenda.');
      setAppointments([]);
      setBusy([]);
    } else {
      const body = await res.json();
      setAppointments(body.appointments ?? []);
      setBusy(body.googleBusy ?? []);
    }
    setLoading(false);
  }, [from, to]);

  async function loadPatients() {
    const res = await fetch('/api/patients');
    if (res.ok) {
      const body = await res.json();
      setPatientsList(body.patients ?? []);
    }
  }

  useEffect(() => {
    void (async () => {
      await loadPatients();
    })();
  }, []);

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
        await loadDataRef.current();
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

  function openCreate(startsLocal?: string) {
    const base = new Date();
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    const starts = startsLocal ?? isoToLocal(base.toISOString());
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      starts_local: starts,
      ends_local: addMinutesToLocal(starts, DEFAULT_DURATION_MIN),
    });
    setFormError(null);
    setSuggestionsOpen(false);
    setFormOpen(true);
  }

  function openCreateAt(dateKey: string, hour = 9) {
    openCreate(`${dateKey}T${String(hour).padStart(2, '0')}:00`);
  }

  function openEdit(a: Appointment) {
    setEditing(a);
    setForm({
      patient_name: a.patient_name,
      patient_phone: a.patient_phone,
      patient_cpf: '',
      starts_local: isoToLocal(a.starts_at),
      ends_local: isoToLocal(a.ends_at),
      notes: a.notes ?? '',
      repeat: 'none',
      until: '',
    });
    setFormError(null);
    setSuggestionsOpen(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
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
    if (
      !editing &&
      form.repeat !== 'none' &&
      form.starts_local.slice(0, 10) !== form.ends_local.slice(0, 10)
    ) {
      setFormError(
        'Para repetir, início e fim devem ser no mesmo dia — eles definem o horário de UMA consulta. Use "Repetir até" para a data em que a série termina.',
      );
      return;
    }
    const cpf = normalizeCpf(form.patient_cpf);
    if (cpf && !isValidCpf(cpf)) {
      setFormError('CPF inválido.');
      return;
    }

    setSaving(true);

    // Consulta recorrente (só na criação): cria a série e materializa as
    // ocorrências; senão, fluxo normal de appointment único.
    if (!editing && form.repeat !== 'none') {
      const res = await fetch('/api/recurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: form.patient_name.trim(),
          patient_phone: phone,
          cpf: cpf || null,
          starts_at: localToISO(form.starts_local),
          ends_at: localToISO(form.ends_local),
          frequency: form.repeat,
          until: form.until || null,
          notes: form.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      setSaving(false);
      if (!res.ok) {
        setFormError(body.error ?? 'Erro ao criar a recorrência.');
        return;
      }
      await Promise.all([loadData(), loadPatients()]);
      closeForm();
      return;
    }

    const payload = {
      patient_name: form.patient_name.trim(),
      patient_phone: phone,
      cpf: cpf || null,
      starts_at: localToISO(form.starts_local),
      ends_at: localToISO(form.ends_local),
      notes: form.notes.trim() || null,
    };
    const url = editing ? `/api/appointments/${editing.id}` : '/api/appointments';
    const method = editing ? 'PATCH' : 'POST';
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

    await Promise.all([loadData(), loadPatients()]);
    closeForm();
  }

  async function stopSeries(a: Appointment) {
    if (!a.recurrence_id) return;
    if (
      !window.confirm(
        'Encerrar esta série? As consultas futuras desta recorrência serão canceladas (as passadas permanecem).',
      )
    ) {
      return;
    }
    const res = await fetch(`/api/recurrences/${a.recurrence_id}/stop`, {
      method: 'POST',
    });
    if (res.ok) {
      await loadData();
      closeForm();
    }
  }

  async function patchStatus(id: string, status: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadData();
      closeForm();
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
      await loadData();
      closeForm();
    }
  }

  function statusActions(a: Appointment) {
    if (a.status === 'pending_approval') {
      return (
        <>
          <Button type="button" size="sm" onClick={() => patchStatus(a.id, 'scheduled')}>
            Aprovar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => cancel(a)}>
            Rejeitar
          </Button>
        </>
      );
    }
    if (a.status === 'scheduled') {
      return (
        <>
          <Button type="button" size="sm" variant="outline" onClick={() => patchStatus(a.id, 'confirmed')}>
            Confirmar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => cancel(a)}>
            Cancelar
          </Button>
        </>
      );
    }
    if (a.status === 'confirmed') {
      return (
        <>
          <Button type="button" size="sm" variant="outline" onClick={() => patchStatus(a.id, 'no_show')}>
            Não compareceu
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => cancel(a)}>
            Cancelar
          </Button>
        </>
      );
    }
    return null;
  }

  function navigate(dir: -1 | 1) {
    setCursor((c) => (view === 'week' ? addDays(c, dir * 7) : addMonths(c, dir)));
  }

  const headerLabel =
    view === 'week'
      ? (() => {
          const start = startOfWeek(cursor, { weekStartsOn: 1 });
          const end = addDays(start, 6);
          const sameMonth = start.getMonth() === end.getMonth();
          return sameMonth
            ? `${format(start, 'dd')} – ${format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
            : `${format(start, "dd 'de' MMM", { locale: ptBR })} – ${format(end, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
        })()
      : (() => {
          const label = format(cursor, "MMMM 'de' yyyy", { locale: ptBR });
          return label.charAt(0).toUpperCase() + label.slice(1);
        })();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        description={headerLabel}
        actions={
          <>
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
              <Button
                type="button"
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mês
              </Button>
              <Button
                type="button"
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semana
              </Button>
            </div>
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
                ←
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
                Hoje
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate(1)}>
                →
              </Button>
            </div>
            {!formOpen && <Button onClick={() => openCreate()}>Novo agendamento</Button>}
          </>
        }
      />

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Editar agendamento' : 'Novo agendamento'}</CardTitle>
            <CardDescription>
              Horários interpretados em America/Sao_Paulo. Se o paciente já existir
              (mesmo telefone), seu cadastro é reutilizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {editing && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {STATUS_LABEL[editing.status]}
                </span>
                {statusActions(editing)}
                {editing.status !== 'cancelled' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `/documentos/declaracao/${editing.id}`,
                        '_blank',
                      )
                    }
                  >
                    Declaração
                  </Button>
                )}
                {editing.recurrence_id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => stopSeries(editing)}
                  >
                    Encerrar série 🔁
                  </Button>
                )}
              </div>
            )}
            {editing?.recurrence_id && (
              <p className="mb-4 -mt-2 text-xs text-muted-foreground">
                🔁 Esta consulta faz parte de uma série recorrente. Editar ou
                cancelar aqui afeta só esta ocorrência; use “Encerrar série” para
                cancelar as futuras.
              </p>
            )}
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nome do paciente" htmlFor="ap_name">
                  <div className="relative">
                    <Input
                      id="ap_name"
                      value={form.patient_name}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, patient_name: e.target.value }));
                        setSuggestionsOpen(true);
                      }}
                      onFocus={() => setSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
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
                              <span className="font-medium truncate w-full">{p.name}</span>
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
                </FormField>
                <FormField label="Telefone" htmlFor="ap_phone">
                  <Input
                    id="ap_phone"
                    value={form.patient_phone}
                    onChange={(e) => setForm((p) => ({ ...p, patient_phone: e.target.value }))}
                    placeholder="5511999998888"
                    required
                  />
                </FormField>
                <FormField label="CPF (opcional)" htmlFor="ap_cpf">
                  <Input
                    id="ap_cpf"
                    value={form.patient_cpf}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, patient_cpf: maskCpfInput(e.target.value) }))
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
                    onChange={(e) => setForm((p) => ({ ...p, ends_local: e.target.value }))}
                    required
                  />
                </FormField>
              </div>

              {!editing && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Repetir" htmlFor="ap_repeat">
                      <Select
                        items={REPEAT_ITEMS}
                        value={form.repeat}
                        onValueChange={(v) =>
                          setForm((p) => {
                            const repeat = (v ?? 'none') as Repeat;
                            // Ao ativar a repetição, garante que o fim fique no
                            // mesmo dia do início (é o horário de UMA consulta).
                            const sameDay =
                              p.starts_local.slice(0, 10) ===
                              p.ends_local.slice(0, 10);
                            const ends_local =
                              repeat !== 'none' && p.starts_local && !sameDay
                                ? addMinutesToLocal(
                                    p.starts_local,
                                    DEFAULT_DURATION_MIN,
                                  )
                                : p.ends_local;
                            return { ...p, repeat, ends_local };
                          })
                        }
                      >
                        <SelectTrigger id="ap_repeat" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não repete</SelectItem>
                          <SelectItem value="weekly">Toda semana</SelectItem>
                          <SelectItem value="biweekly">
                            A cada 2 semanas
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    {form.repeat !== 'none' && (
                      <FormField label="Repetir até (opcional)" htmlFor="ap_until">
                        <Input
                          id="ap_until"
                          type="date"
                          value={form.until}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, until: e.target.value }))
                          }
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Data em que a repetição para. Deixe vazio para repetir
                          sem fim.
                        </p>
                      </FormField>
                    )}
                  </div>
                  {form.repeat !== 'none' && (
                    <p className="-mt-1 text-xs text-muted-foreground">
                      🔁 <strong>Início</strong> e <strong>Fim</strong> acima são o
                      horário de <strong>uma</strong> consulta (mesmo dia). Ela vai
                      se repetir {form.repeat === 'weekly' ? 'toda semana' : 'a cada 2 semanas'} no
                      mesmo dia e horário, até a data de “Repetir até”.
                    </p>
                  )}
                </>
              )}

              <FormField label="Anotações (opcional)" htmlFor="ap_notes">
                <Textarea
                  id="ap_notes"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Ex.: primeira consulta, encaminhamento, etc."
                />
              </FormField>

              {formError && <div className="text-sm text-destructive">{formError}</div>}

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar agendamento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="text-sm text-destructive py-4">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground py-6">
            Carregando agenda…
          </CardContent>
        </Card>
      ) : view === 'month' ? (
        <CalendarMonth
          monthCursor={cursor}
          appointments={appointments}
          busy={busy}
          onSelectAppointment={openEdit}
          onSelectDay={(key) => openCreateAt(key)}
        />
      ) : (
        <CalendarWeek
          weekStart={startOfWeek(cursor, { weekStartsOn: 1 })}
          appointments={appointments}
          busy={busy}
          onSelectAppointment={openEdit}
          onSelectSlot={(key, hour) => openCreateAt(key, hour)}
        />
      )}
    </div>
  );
}
