import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/zapi/client';
import { isPersonalCommitment } from '@/lib/appointments/personal';
import {
  buildPersonalReminderMessage,
  checkPersonalReminderDelivery,
} from '@/lib/assistant/reminders';
import type { ReminderType } from '@/types/database';

const TZ = 'America/Sao_Paulo';

type ReminderRow = {
  id: string;
  type: ReminderType;
  scheduled_for: string;
  professional_id: string;
  appointment_id: string;
  appointment: {
    patient_phone: string;
    patient_name: string;
    starts_at: string;
    status: string;
  } | null;
  professional: {
    zapi_instance_id: string | null;
    zapi_token: string | null;
    name: string;
    whatsapp_connected: boolean;
    plan_status: string;
  } | null;
};

function formatBr(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    ...options,
  }).format(new Date(iso));
}

function buildMessage(
  type: ReminderType,
  professionalName: string,
  startsAt: string,
): string {
  if (type === '24h') {
    const date = formatBr(startsAt, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
    const time = formatBr(startsAt, { hour: '2-digit', minute: '2-digit' });
    return `Olá! Aqui é a secretária de ${professionalName}. Seu atendimento está marcado para ${date} às ${time}. Podemos confirmar?`;
  }

  const time = formatBr(startsAt, { hour: '2-digit', minute: '2-digit' });
  return `Olá! Seu atendimento com ${professionalName} é hoje, às ${time}. Estou te esperando.`;
}

type PersonalReminderRow = {
  id: string;
  text: string;
  remind_at: string;
  professional_id: string;
  professional: {
    phone: string | null;
    zapi_instance_id: string | null;
    zapi_token: string | null;
    whatsapp_connected: boolean;
    plan_status: string;
  } | null;
};

type Counters = { total: number; sent: number; failed: number; skipped: number };

// Lembretes pessoais do Assistente: o aviso vai para o PRÓPRIO profissional
// (professionals.phone), pelo WhatsApp dele. Mesmo padrão de reserva dos
// lembretes de cliente (pending → sent antes de enviar).
async function dispatchPersonalReminders(
  supabase: ReturnType<typeof createServerClient>,
  now: string,
): Promise<Counters & { error?: boolean }> {
  const counters: Counters = { total: 0, sent: 0, failed: 0, skipped: 0 };

  const { data, error } = await supabase
    .from('personal_reminders')
    .select(
      `
      id, text, remind_at, professional_id,
      professional:professionals ( phone, zapi_instance_id, zapi_token, whatsapp_connected, plan_status )
    `,
    )
    .eq('status', 'pending')
    .lte('remind_at', now)
    .limit(50);

  if (error) {
    console.error('Erro ao listar lembretes pessoais:', error);
    return { ...counters, error: true };
  }

  const rows = (data ?? []) as unknown as PersonalReminderRow[];
  counters.total = rows.length;

  for (const row of rows) {
    const prof = row.professional;
    const check = prof
      ? checkPersonalReminderDelivery(prof)
      : ({ ok: false, reason: 'Profissional ausente' } as const);

    if (!check.ok || !prof) {
      await supabase
        .from('personal_reminders')
        .update({
          status: 'failed',
          error_message: check.ok ? 'Profissional ausente' : check.reason,
        })
        .eq('id', row.id)
        .eq('status', 'pending');
      counters.skipped++;
      continue;
    }

    // Reserva antes de enviar (cron roda a cada minuto; duas execuções podem
    // pegar o mesmo lembrete). Só quem trocar pending → sent envia.
    const { data: claimed } = await supabase
      .from('personal_reminders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id');
    if (!claimed || claimed.length === 0) {
      counters.skipped++;
      continue;
    }

    try {
      await sendWhatsAppMessage(
        prof.zapi_instance_id!,
        prof.zapi_token ?? '',
        check.phone,
        buildPersonalReminderMessage(row.text),
      );
      counters.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Falha ao enviar lembrete pessoal ${row.id}:`, message);
      await supabase
        .from('personal_reminders')
        .update({ status: 'failed', error_message: message })
        .eq('id', row.id);
      counters.failed++;
    }
  }

  return counters;
}

async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('reminders')
    .select(
      `
      id, type, scheduled_for, professional_id, appointment_id,
      appointment:appointments ( patient_phone, patient_name, starts_at, status ),
      professional:professionals ( zapi_instance_id, zapi_token, name, whatsapp_connected, plan_status )
    `,
    )
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .limit(50);

  if (error) {
    console.error('Erro ao listar reminders:', error);
    return NextResponse.json(
      { error: 'Erro ao listar reminders' },
      { status: 500 },
    );
  }

  const reminders = (data ?? []) as unknown as ReminderRow[];

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    const appt = reminder.appointment;
    const prof = reminder.professional;

    if (!appt || !prof) {
      await supabase
        .from('reminders')
        .update({
          status: 'failed',
          error_message: 'Appointment ou professional ausente',
        })
        .eq('id', reminder.id);
      failed++;
      continue;
    }

    // Compromisso pessoal (criado pelo Assistente) não tem cliente: sem
    // telefone (vazio ou só espaços/símbolos) não há para quem mandar o lembrete.
    if (isPersonalCommitment(appt.patient_phone)) {
      await supabase
        .from('reminders')
        .update({ status: 'cancelled', error_message: 'Compromisso sem cliente' })
        .eq('id', reminder.id);
      skipped++;
      continue;
    }

    if (!['scheduled', 'confirmed'].includes(appt.status)) {
      await supabase
        .from('reminders')
        .update({
          status: 'cancelled',
          error_message: `Appointment status: ${appt.status}`,
        })
        .eq('id', reminder.id);
      skipped++;
      continue;
    }

    if (!['trialing', 'active'].includes(prof.plan_status)) {
      await supabase
        .from('reminders')
        .update({
          status: 'failed',
          error_message: `Plano inativo: ${prof.plan_status}`,
        })
        .eq('id', reminder.id);
      skipped++;
      continue;
    }

    if (!prof.zapi_instance_id || !prof.whatsapp_connected) {
      await supabase
        .from('reminders')
        .update({
          status: 'failed',
          error_message: 'WhatsApp não conectado',
        })
        .eq('id', reminder.id);
      skipped++;
      continue;
    }

    // LGPD: respeita a oposição do cliente a mensagens ativas (lembretes).
    const { data: pat } = await supabase
      .from('patients')
      .select('messaging_opted_out')
      .eq('professional_id', reminder.professional_id)
      .eq('phone', appt.patient_phone)
      .maybeSingle();
    if (pat?.messaging_opted_out) {
      await supabase
        .from('reminders')
        .update({ status: 'cancelled', error_message: 'Cliente optou por não receber mensagens' })
        .eq('id', reminder.id);
      skipped++;
      continue;
    }

    const text = buildMessage(reminder.type, prof.name, appt.starts_at);

    // Reserva o lembrete ANTES de enviar: o cron externo roda a cada minuto e
    // duas execuções podem pegar o mesmo lembrete. Só quem conseguir trocar
    // pending → sent envia; a outra execução pula. Se o envio falhar, o
    // catch abaixo regrava como failed.
    const { data: claimed } = await supabase
      .from('reminders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', reminder.id)
      .eq('status', 'pending')
      .select('id');
    if (!claimed || claimed.length === 0) {
      skipped++;
      continue;
    }

    try {
      await sendWhatsAppMessage(
        prof.zapi_instance_id,
        prof.zapi_token ?? '',
        appt.patient_phone,
        text,
      );
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Falha ao enviar lembrete ${reminder.id}:`, message);
      await supabase
        .from('reminders')
        .update({ status: 'failed', error_message: message })
        .eq('id', reminder.id);
      failed++;
    }
  }

  const personal = await dispatchPersonalReminders(supabase, now);

  return NextResponse.json({
    ok: true,
    total: reminders.length,
    sent,
    failed,
    skipped,
    personal: {
      total: personal.total,
      sent: personal.sent,
      failed: personal.failed,
      skipped: personal.skipped,
    },
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
