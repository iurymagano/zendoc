// Executa no banco as ferramentas que a IA do Assistente pediu.
//
// Regras que valem para TODAS as ferramentas:
//  - o profissional vem da sessão (ctx.professional) — nunca de dados da IA;
//    toda query filtra por professional_id (o client de serviço bypassa RLS);
//  - o input já chegou validado por parseToolInput (tools.ts);
//  - nunca lança: erro de negócio vira `{ ok: false, error }` (a IA lê e explica
//    ao usuário); erro inesperado é logado e vira mensagem genérica.
import { format } from 'date-fns';
import { createServerClient } from '@/lib/supabase';
import { getAvailableSlots } from '@/lib/availability/slots';
import { findConflictingAppointments } from '@/lib/appointments/conflicts';
import {
  cancelPendingAppointmentReminders,
  rescheduleAppointmentReminders,
} from '@/lib/appointments/reminders';
import { syncAppointmentToGoogle } from '@/lib/google/appointment-sync';
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR } from '@/lib/phone';
import type { Appointment, Professional } from '@/types/database';
import {
  addMinutesToIso,
  buildIso,
  dayRangeIso,
  formatBrDate,
  formatBrDateTime,
  formatTime,
  saoPauloParts,
  weekdayShortOf,
} from './datetime';
import {
  DEFAULT_APPOINTMENT_MIN,
  DEFAULT_PERSONAL_EVENT_MIN,
} from './prompt';
import { checkPersonalReminderDelivery } from './reminders';
import type { ToolInput, ToolName } from './tools';

export type ToolContext = {
  /** Profissional dono da sessão (linha completa de `professionals`). */
  professional: Professional;
  /** Injetável para teste; padrão = agora. */
  now?: Date;
};

export type ToolOutcome =
  | {
      ok: true;
      /** Devolvido à IA como tool_result. */
      data: Record<string, unknown>;
      /** Frase curta para a UI ("Atendimento criado: ter, 18/11 às 14:00"). */
      action?: string;
    }
  | { ok: false; error: string };

const MAX_PENDING_REMINDERS = 100;
const ACTIVE = ['scheduled', 'confirmed', 'pending_approval'];
const CONFIRM_ERROR =
  'Falta a confirmação do usuário. Mostre qual item será alterado e peça um "sim" explícito; só então chame de novo com confirmed=true.';

const fail = (error: string): ToolOutcome => ({ ok: false, error });

/** Escapa curingas do ilike para casar o nome literalmente. */
function ilikeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const isPersonal = (a: { patient_phone: string }) => !a.patient_phone;

function describeItem(a: Pick<Appointment, 'patient_name' | 'starts_at'>): string {
  return `${a.patient_name} — ${formatBrDateTime(a.starts_at)}`;
}

function conflictError(
  conflicts: { patient_name: string; starts_at: string; ends_at: string }[],
): ToolOutcome {
  const lines = conflicts
    .map(
      (c) =>
        `${c.patient_name} (${formatBrDate(saoPauloParts(new Date(c.starts_at)).date)} ${formatTime(c.starts_at)}-${formatTime(c.ends_at)})`,
    )
    .join('; ');
  return fail(`Conflito: já existe algo nesse horário — ${lines}.`);
}

// ─── Ferramentas ────────────────────────────────────────────────────────────

async function listAgenda(
  ctx: ToolContext,
  input: ToolInput<'list_agenda'>,
): Promise<ToolOutcome> {
  const supabase = createServerClient();
  const to = input.date_to ?? input.date_from;
  const { start, endExclusive } = dayRangeIso(input.date_from, to);

  const { data, error } = await supabase
    .from('appointments')
    .select('id, patient_name, patient_phone, starts_at, ends_at, status, notes')
    .eq('professional_id', ctx.professional.id)
    .in('status', ACTIVE)
    .gte('starts_at', start)
    .lt('starts_at', endExclusive)
    .order('starts_at')
    .limit(100);
  if (error) {
    console.error('assistente: erro ao listar agenda:', error);
    return fail('Erro ao ler a agenda.');
  }

  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('date, type, note, start_time, end_time')
    .eq('professional_id', ctx.professional.id)
    .gte('date', input.date_from)
    .lte('date', to)
    .order('date');

  const items = (data ?? []).map((a) => {
    const p = saoPauloParts(new Date(a.starts_at));
    return {
      id: a.id,
      date: p.date,
      weekday: weekdayShortOf(p.date),
      start: p.time,
      end: formatTime(a.ends_at),
      title: a.patient_name,
      kind: isPersonal(a) ? 'compromisso pessoal' : 'atendimento com cliente',
      status: a.status,
      notes: a.notes ?? undefined,
    };
  });

  return {
    ok: true,
    data: {
      from: input.date_from,
      to,
      count: items.length,
      items,
      day_exceptions: (exceptions ?? []).map((e) => ({
        date: e.date,
        type: e.type, // day_off = folga; custom_hours/extra_day = horário especial
        note: e.note ?? undefined,
        hours:
          e.start_time && e.end_time
            ? `${String(e.start_time).slice(0, 5)}-${String(e.end_time).slice(0, 5)}`
            : undefined,
      })),
    },
  };
}

async function listFreeSlots(
  ctx: ToolContext,
  input: ToolInput<'list_free_slots'>,
): Promise<ToolOutcome> {
  const slots = await getAvailableSlots(ctx.professional.id, 14);
  const from = input.date_from ?? '0000-01-01';
  const to = input.date_to ?? '9999-12-31';
  const limit = input.limit ?? 20;

  // Slot.start/end carregam o "relógio da agenda" nos campos locais do Date —
  // a mesma premissa do prompt de agendamento do WhatsApp (lib/ai).
  const inRange = slots.filter((s) => {
    const d = format(s.start, 'yyyy-MM-dd');
    return d >= from && d <= to;
  });

  const byDate = new Map<string, string[]>();
  for (const s of inRange.slice(0, limit)) {
    const d = format(s.start, 'yyyy-MM-dd');
    const list = byDate.get(d) ?? [];
    list.push(`${format(s.start, 'HH:mm')}-${format(s.end, 'HH:mm')}`);
    byDate.set(d, list);
  }

  return {
    ok: true,
    data: {
      total_in_range: inRange.length,
      shown: Math.min(inRange.length, limit),
      days: Array.from(byDate, ([date, free]) => ({
        date,
        weekday: weekdayShortOf(date),
        free,
      })),
      note: 'Horários da rotina de atendimento, de amanhã até 14 dias. Marcar fora dessa lista também é possível (create_appointment).',
    },
  };
}

async function createAppointment(
  ctx: ToolContext,
  input: ToolInput<'create_appointment'>,
): Promise<ToolOutcome> {
  const now = ctx.now ?? new Date();
  const supabase = createServerClient();
  const profId = ctx.professional.id;

  const startIso = buildIso(input.date, input.time);
  if (!startIso) return fail('Data ou hora inválida.');
  if (Date.parse(startIso) < now.getTime() - 60_000) {
    return fail('Esse horário já passou. Informe uma data/hora futura.');
  }

  let serviceId: string | null = null;
  let serviceDuration: number | null = null;
  if (input.service_id) {
    const { data: svc } = await supabase
      .from('services')
      .select('id, duration_min')
      .eq('id', input.service_id)
      .eq('professional_id', profId)
      .eq('active', true)
      .maybeSingle();
    if (!svc) return fail('Serviço não encontrado entre os cadastrados.');
    serviceId = svc.id;
    serviceDuration = svc.duration_min;
  }

  const duration = input.duration_min ?? serviceDuration ?? DEFAULT_APPOINTMENT_MIN;
  const endIso = addMinutesToIso(startIso, duration);

  const conflicts = await findConflictingAppointments(profId, startIso, endIso);
  if (conflicts.length > 0) return conflictError(conflicts);

  // Resolve o cliente: por telefone (se veio) ou pelo nome (se já cadastrado).
  let patientId: string | null = null;
  let patientName = input.client_name;
  let patientPhone: string;

  if (input.client_phone) {
    patientPhone = normalizePhoneBR(input.client_phone);
    if (!isValidPhoneBR(patientPhone)) {
      return fail('Telefone inválido: informe DDD + número (ex.: 11 91111-2222).');
    }
    const { data: existing } = await supabase
      .from('patients')
      .select('id, name')
      .eq('professional_id', profId)
      .eq('phone', patientPhone)
      .maybeSingle();
    if (existing) {
      patientId = existing.id;
      patientName = existing.name; // não sobrescreve o cadastro existente
    } else {
      const { data: created, error } = await supabase
        .from('patients')
        .insert({ professional_id: profId, phone: patientPhone, name: input.client_name })
        .select('id')
        .single();
      if (error || !created) {
        console.error('assistente: erro ao cadastrar cliente:', error);
        return fail('Erro ao cadastrar o cliente.');
      }
      patientId = created.id;
    }
  } else {
    const { data: matches } = await supabase
      .from('patients')
      .select('id, name, phone')
      .eq('professional_id', profId)
      .ilike('name', ilikeExact(input.client_name))
      .limit(3);
    if (!matches || matches.length === 0) {
      return fail(
        `"${input.client_name}" ainda não está cadastrado(a). Peça o telefone com DDD para cadastrar e marcar.`,
      );
    }
    if (matches.length > 1) {
      const opts = matches.map((m) => `${m.name} (${formatPhoneBR(m.phone)})`).join('; ');
      return fail(`Mais de um cliente com esse nome: ${opts}. Pergunte qual é (pelo telefone).`);
    }
    patientId = matches[0].id;
    patientName = matches[0].name;
    patientPhone = matches[0].phone;
  }

  const { data: appt, error } = await supabase
    .from('appointments')
    .insert({
      professional_id: profId,
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone,
      starts_at: startIso,
      ends_at: endIso,
      status: 'scheduled',
      booked_via: 'manual',
      notes: input.notes?.trim() || null,
      service_id: serviceId,
    })
    .select()
    .single();
  if (error || !appt) {
    console.error('assistente: erro ao criar atendimento:', error);
    return fail('Erro ao criar o atendimento.');
  }

  await syncAppointmentToGoogle(appt as Appointment);

  const label = formatBrDateTime(startIso, now);
  return {
    ok: true,
    data: {
      id: appt.id,
      client: patientName,
      starts: label,
      ends_at: formatTime(endIso),
      duration_min: duration,
    },
    action: `Atendimento criado: ${label} — ${patientName}`,
  };
}

async function createPersonalEvent(
  ctx: ToolContext,
  input: ToolInput<'create_personal_event'>,
): Promise<ToolOutcome> {
  const now = ctx.now ?? new Date();
  const supabase = createServerClient();
  const profId = ctx.professional.id;

  const startIso = buildIso(input.date, input.time);
  if (!startIso) return fail('Data ou hora inválida.');
  if (Date.parse(startIso) < now.getTime() - 60_000) {
    return fail('Esse horário já passou. Informe uma data/hora futura.');
  }
  const duration = input.duration_min ?? DEFAULT_PERSONAL_EVENT_MIN;
  const endIso = addMinutesToIso(startIso, duration);

  const conflicts = await findConflictingAppointments(profId, startIso, endIso);
  if (conflicts.length > 0) return conflictError(conflicts);

  // Compromisso pessoal = appointment manual SEM cliente (patient_phone vazio):
  // ocupa o horário (slots e conflitos já o respeitam), aparece na agenda e no
  // Google, e nenhuma mensagem sai para ninguém.
  const { data: appt, error } = await supabase
    .from('appointments')
    .insert({
      professional_id: profId,
      patient_id: null,
      patient_name: input.title,
      patient_phone: '',
      starts_at: startIso,
      ends_at: endIso,
      status: 'scheduled',
      booked_via: 'manual',
      notes: input.notes?.trim()
        ? `Compromisso pessoal — ${input.notes.trim()}`
        : 'Compromisso pessoal',
    })
    .select()
    .single();
  if (error || !appt) {
    console.error('assistente: erro ao criar compromisso pessoal:', error);
    return fail('Erro ao criar o compromisso.');
  }

  // O trigger do banco criou lembretes 24h/2h para o "cliente" — não há cliente.
  await cancelPendingAppointmentReminders(appt.id);
  await syncAppointmentToGoogle(appt as Appointment);

  const label = formatBrDateTime(startIso, now);
  return {
    ok: true,
    data: { id: appt.id, title: input.title, starts: label, ends_at: formatTime(endIso), duration_min: duration },
    action: `Compromisso criado: ${label} — ${input.title}`,
  };
}

async function setDayOff(
  ctx: ToolContext,
  input: ToolInput<'set_day_off'>,
): Promise<ToolOutcome> {
  const now = ctx.now ?? new Date();
  const supabase = createServerClient();
  const profId = ctx.professional.id;

  if (input.date < saoPauloParts(now).date) {
    return fail('Essa data já passou.');
  }

  const { data: existing } = await supabase
    .from('availability_exceptions')
    .select('id, type')
    .eq('professional_id', profId)
    .eq('date', input.date)
    .maybeSingle();
  if (existing) {
    if (existing.type === 'day_off') {
      return { ok: true, data: { date: input.date, already: true } };
    }
    return fail(
      `Esse dia já tem uma exceção de horário (${existing.type}). Ajuste em Configurações → Exceções.`,
    );
  }

  const { error } = await supabase.from('availability_exceptions').insert({
    professional_id: profId,
    date: input.date,
    type: 'day_off',
    note: input.note?.trim() || null,
  });
  if (error) {
    console.error('assistente: erro ao marcar folga:', error);
    return fail('Erro ao marcar a folga.');
  }

  const { start, endExclusive } = dayRangeIso(input.date, input.date);
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', profId)
    .in('status', ACTIVE)
    .gte('starts_at', start)
    .lt('starts_at', endExclusive);

  const label = formatBrDate(input.date, now);
  return {
    ok: true,
    data: {
      date: input.date,
      appointments_still_scheduled: count ?? 0,
      warning:
        (count ?? 0) > 0
          ? 'Há atendimentos já marcados nesse dia — eles NÃO foram cancelados.'
          : undefined,
    },
    action: `Folga marcada: ${label}`,
  };
}

async function loadActiveAppointment(
  professionalId: string,
  id: string,
): Promise<{ appt: Appointment } | { error: string }> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('professional_id', professionalId)
    .maybeSingle();
  if (!data) return { error: 'Atendimento não encontrado.' };
  const appt = data as Appointment;
  if (!ACTIVE.includes(appt.status)) {
    return { error: 'Esse item já está cancelado ou encerrado.' };
  }
  return { appt };
}

async function cancelAppointment(
  ctx: ToolContext,
  input: ToolInput<'cancel_appointment'>,
): Promise<ToolOutcome> {
  if (!input.confirmed) return fail(CONFIRM_ERROR);
  const supabase = createServerClient();
  const profId = ctx.professional.id;

  const loaded = await loadActiveAppointment(profId, input.appointment_id);
  if ('error' in loaded) return fail(loaded.error);

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_by: 'professional',
      cancellation_note: input.reason?.trim() || null,
    })
    .eq('id', input.appointment_id)
    .eq('professional_id', profId)
    .select()
    .maybeSingle();
  if (error || !data) {
    console.error('assistente: erro ao cancelar:', error);
    return fail('Erro ao cancelar.');
  }

  await syncAppointmentToGoogle(data as Appointment);

  const label = describeItem(loaded.appt);
  return {
    ok: true,
    data: {
      cancelled: label,
      client_notified: false,
      had_client: !isPersonal(loaded.appt),
    },
    action: `Cancelado: ${label}`,
  };
}

async function rescheduleAppointment(
  ctx: ToolContext,
  input: ToolInput<'reschedule_appointment'>,
): Promise<ToolOutcome> {
  if (!input.confirmed) return fail(CONFIRM_ERROR);
  const now = ctx.now ?? new Date();
  const supabase = createServerClient();
  const profId = ctx.professional.id;

  const loaded = await loadActiveAppointment(profId, input.appointment_id);
  if ('error' in loaded) return fail(loaded.error);
  const old = loaded.appt;

  const startIso = buildIso(input.date, input.time);
  if (!startIso) return fail('Data ou hora inválida.');
  if (Date.parse(startIso) < now.getTime() - 60_000) {
    return fail('Esse horário já passou. Informe uma data/hora futura.');
  }

  const oldMinutes = Math.round(
    (Date.parse(old.ends_at) - Date.parse(old.starts_at)) / 60_000,
  );
  const endIso = addMinutesToIso(startIso, input.duration_min ?? oldMinutes);

  const conflicts = await findConflictingAppointments(profId, startIso, endIso, old.id);
  if (conflicts.length > 0) return conflictError(conflicts);

  const { data, error } = await supabase
    .from('appointments')
    .update({ starts_at: startIso, ends_at: endIso })
    .eq('id', old.id)
    .eq('professional_id', profId)
    .select()
    .maybeSingle();
  if (error || !data) {
    console.error('assistente: erro ao remarcar:', error);
    return fail('Erro ao remarcar.');
  }

  if (!isPersonal(old)) await rescheduleAppointmentReminders(old.id, startIso);
  await syncAppointmentToGoogle(data as Appointment);

  const label = `${old.patient_name}: ${formatBrDateTime(old.starts_at, now)} → ${formatBrDateTime(startIso, now)}`;
  return {
    ok: true,
    data: {
      rescheduled: label,
      client_notified: false,
      had_client: !isPersonal(old),
    },
    action: `Remarcado: ${label}`,
  };
}

async function createReminder(
  ctx: ToolContext,
  input: ToolInput<'create_reminder'>,
): Promise<ToolOutcome> {
  const now = ctx.now ?? new Date();
  const supabase = createServerClient();
  const profId = ctx.professional.id;

  const remindIso = buildIso(input.date, input.time);
  if (!remindIso) return fail('Data ou hora inválida.');
  if (Date.parse(remindIso) < now.getTime() + 30_000) {
    return fail('Esse horário já passou. Informe uma data/hora futura.');
  }

  const { count } = await supabase
    .from('personal_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', profId)
    .eq('status', 'pending');
  if ((count ?? 0) >= MAX_PENDING_REMINDERS) {
    return fail(
      `Limite de ${MAX_PENDING_REMINDERS} lembretes pendentes. Cancele alguns antes de criar outro.`,
    );
  }

  const { data, error } = await supabase
    .from('personal_reminders')
    .insert({ professional_id: profId, text: input.text, remind_at: remindIso })
    .select('id')
    .single();
  if (error || !data) {
    console.error('assistente: erro ao criar lembrete:', error);
    return fail('Erro ao criar o lembrete.');
  }

  const delivery = checkPersonalReminderDelivery(ctx.professional);
  const label = formatBrDateTime(remindIso, now);
  return {
    ok: true,
    data: {
      id: data.id,
      when: label,
      warning: delivery.ok
        ? undefined
        : `Este lembrete NÃO será entregue enquanto isto não for resolvido: ${delivery.reason}.`,
    },
    action: `Lembrete criado: ${label} — ${input.text}`,
  };
}

async function listReminders(
  ctx: ToolContext,
  input: ToolInput<'list_reminders'>,
): Promise<ToolOutcome> {
  const supabase = createServerClient();
  const status = input.status ?? 'pending';
  const { data, error } = await supabase
    .from('personal_reminders')
    .select('id, text, remind_at, status, error_message')
    .eq('professional_id', ctx.professional.id)
    .eq('status', status)
    .order('remind_at', { ascending: status === 'pending' })
    .limit(20);
  if (error) {
    console.error('assistente: erro ao listar lembretes:', error);
    return fail('Erro ao listar os lembretes.');
  }
  return {
    ok: true,
    data: {
      status,
      count: (data ?? []).length,
      items: (data ?? []).map((r) => ({
        id: r.id,
        text: r.text,
        when: formatBrDateTime(r.remind_at),
        error: r.error_message ?? undefined,
      })),
    },
  };
}

async function cancelReminder(
  ctx: ToolContext,
  input: ToolInput<'cancel_reminder'>,
): Promise<ToolOutcome> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('personal_reminders')
    .update({ status: 'cancelled' })
    .eq('id', input.reminder_id)
    .eq('professional_id', ctx.professional.id)
    .eq('status', 'pending')
    .select('text')
    .maybeSingle();
  if (error) {
    console.error('assistente: erro ao cancelar lembrete:', error);
    return fail('Erro ao cancelar o lembrete.');
  }
  if (!data) return fail('Lembrete não encontrado ou já não está pendente.');
  return {
    ok: true,
    data: { cancelled: data.text },
    action: `Lembrete cancelado: ${data.text}`,
  };
}

// ─── Despacho ───────────────────────────────────────────────────────────────

const HANDLERS: {
  [N in ToolName]: (ctx: ToolContext, input: ToolInput<N>) => Promise<ToolOutcome>;
} = {
  list_agenda: listAgenda,
  list_free_slots: listFreeSlots,
  create_appointment: createAppointment,
  create_personal_event: createPersonalEvent,
  set_day_off: setDayOff,
  cancel_appointment: cancelAppointment,
  reschedule_appointment: rescheduleAppointment,
  create_reminder: createReminder,
  list_reminders: listReminders,
  cancel_reminder: cancelReminder,
};

/** Roda uma ferramenta já validada. Nunca lança. */
export async function runTool(
  ctx: ToolContext,
  name: ToolName,
  input: unknown,
): Promise<ToolOutcome> {
  try {
    const handler = HANDLERS[name] as (
      c: ToolContext,
      i: unknown,
    ) => Promise<ToolOutcome>;
    return await handler(ctx, input);
  } catch (err) {
    console.error(`assistente: falha inesperada em ${name}:`, err);
    return fail('Erro interno ao executar a ação.');
  }
}
