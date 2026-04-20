import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/zapi/client';
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
    return `Olá! Aqui é do consultório de ${professionalName}. Sua consulta está marcada para ${date} às ${time}. Podemos confirmar?`;
  }

  const time = formatBr(startsAt, { hour: '2-digit', minute: '2-digit' });
  return `Olá! Sua consulta com ${professionalName} é hoje, às ${time}. Estou te esperando.`;
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

    if (
      !prof.zapi_instance_id ||
      !prof.zapi_token ||
      !prof.whatsapp_connected
    ) {
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

    const text = buildMessage(reminder.type, prof.name, appt.starts_at);

    try {
      await sendWhatsAppMessage(
        prof.zapi_instance_id,
        prof.zapi_token,
        appt.patient_phone,
        text,
      );
      await supabase
        .from('reminders')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', reminder.id);
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

  return NextResponse.json({
    ok: true,
    total: reminders.length,
    sent,
    failed,
    skipped,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
