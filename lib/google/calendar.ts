import crypto from 'node:crypto';
import { createServerClient } from '@/lib/supabase';
import { getAccessToken } from '@/lib/google/auth';
import type { Appointment, Professional } from '@/types/database';

const CAL_BASE = 'https://www.googleapis.com/calendar/v3';
const TZ = 'America/Sao_Paulo';

/** Marca os eventos que NÓS criamos — na hora do pull são ignorados (anti-loop). */
const IAZEN_TAG = 'iazenAppointmentId';

type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
};

async function calFetch(
  professional: Professional,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken(professional);
  return fetch(`${CAL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

function calId(professional: Professional): string {
  return encodeURIComponent(professional.google_calendar_id || 'primary');
}

function eventBody(appointment: Appointment) {
  const sourceLabel =
    appointment.booked_via === 'whatsapp_ai' ? 'IA no WhatsApp' : 'manual';
  const lines = [
    `Agendado via IAzen (${sourceLabel}).`,
    `Paciente: ${appointment.patient_name}`,
    `Telefone: ${appointment.patient_phone}`,
    appointment.notes ? `Notas: ${appointment.notes}` : null,
  ].filter(Boolean);
  return {
    summary: `${appointment.patient_name} — consulta`,
    description: lines.join('\n'),
    start: { dateTime: appointment.starts_at, timeZone: TZ },
    end: { dateTime: appointment.ends_at, timeZone: TZ },
    extendedProperties: { private: { [IAZEN_TAG]: appointment.id } },
  };
}

/**
 * Cria (ou atualiza, se já houver google_event_id) o evento no Google que
 * espelha o appointment. Grava o google_event_id de volta no appointment.
 * Best-effort: o caller deve envolver em try/catch e nunca quebrar a operação.
 */
export async function pushAppointment(
  professional: Professional,
  appointment: Appointment,
): Promise<string | null> {
  if (!professional.google_calendar_connected) return null;

  const existingId = appointment.google_event_id;
  const path = existingId
    ? `/calendars/${calId(professional)}/events/${encodeURIComponent(existingId)}`
    : `/calendars/${calId(professional)}/events`;
  const res = await calFetch(professional, path, {
    method: existingId ? 'PATCH' : 'POST',
    body: JSON.stringify(eventBody(appointment)),
  });

  if (res.status === 404 && existingId) {
    // evento sumiu no Google — recria do zero.
    const recreate = await calFetch(
      professional,
      `/calendars/${calId(professional)}/events`,
      { method: 'POST', body: JSON.stringify(eventBody(appointment)) },
    );
    if (!recreate.ok) {
      throw new Error(`push (recreate) falhou: ${recreate.status}`);
    }
    const created = (await recreate.json()) as GoogleEvent;
    await persistEventId(professional.id, appointment.id, created.id);
    return created.id;
  }

  if (!res.ok) {
    throw new Error(`push falhou: ${res.status} ${await res.text()}`);
  }
  const event = (await res.json()) as GoogleEvent;
  if (!existingId) {
    await persistEventId(professional.id, appointment.id, event.id);
  }
  return event.id;
}

/** Remove o evento do Google (chamado em cancelamento/no-show). */
export async function deleteAppointmentEvent(
  professional: Professional,
  eventId: string,
): Promise<void> {
  if (!professional.google_calendar_connected) return;
  const res = await calFetch(
    professional,
    `/calendars/${calId(professional)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
  );
  // 410 = já removido; tratamos como sucesso.
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`delete falhou: ${res.status}`);
  }
}

async function persistEventId(
  professionalId: string,
  appointmentId: string,
  eventId: string,
): Promise<void> {
  const supabase = createServerClient();
  await supabase
    .from('appointments')
    .update({ google_event_id: eventId })
    .eq('id', appointmentId)
    .eq('professional_id', professionalId);
}

/**
 * Pull incremental do Google → IAzen. Usa syncToken quando disponível; senão
 * faz sync inicial na janela [agora, agora+45d]. Eventos com a tag do IAzen
 * são ignorados (são nossos); o resto vai pra google_busy_events e bloqueia
 * disponibilidade. Persiste o nextSyncToken no profissional.
 */
export async function syncBusyEvents(
  professional: Professional,
): Promise<{ upserted: number; removed: number }> {
  if (!professional.google_calendar_connected) {
    return { upserted: 0, removed: 0 };
  }
  const supabase = createServerClient();
  let syncToken = professional.google_sync_token;
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  let upserted = 0;
  let removed = 0;

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      showDeleted: 'true',
      maxResults: '250',
    });
    if (syncToken) {
      params.set('syncToken', syncToken);
    } else {
      const now = new Date();
      const max = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
      params.set('timeMin', now.toISOString());
      params.set('timeMax', max.toISOString());
      params.set('orderBy', 'startTime');
    }
    if (pageToken) params.set('pageToken', pageToken);

    const res = await calFetch(
      professional,
      `/calendars/${calId(professional)}/events?${params.toString()}`,
    );

    // 410 Gone: syncToken inválido → reseta e faz full resync.
    if (res.status === 410) {
      syncToken = null;
      pageToken = undefined;
      await supabase
        .from('professionals')
        .update({ google_sync_token: null })
        .eq('id', professional.id);
      continue;
    }
    if (!res.ok) {
      throw new Error(`sync falhou: ${res.status} ${await res.text()}`);
    }

    const body = (await res.json()) as {
      items?: GoogleEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    };

    for (const ev of body.items ?? []) {
      // Eventos criados pelo IAzen não viram "busy" (já são appointments).
      if (ev.extendedProperties?.private?.[IAZEN_TAG]) continue;

      if (ev.status === 'cancelled') {
        const { count } = await supabase
          .from('google_busy_events')
          .delete({ count: 'exact' })
          .eq('professional_id', professional.id)
          .eq('google_event_id', ev.id);
        removed += count ?? 0;
        continue;
      }

      const allDay = !!ev.start?.date;
      const startsAt = ev.start?.dateTime ?? ev.start?.date;
      const endsAt = ev.end?.dateTime ?? ev.end?.date;
      if (!startsAt || !endsAt) continue;

      await supabase.from('google_busy_events').upsert(
        {
          professional_id: professional.id,
          google_event_id: ev.id,
          summary: ev.summary ?? null,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          all_day: allDay,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'professional_id,google_event_id' },
      );
      upserted += 1;
    }

    pageToken = body.nextPageToken;
    if (body.nextSyncToken) nextSyncToken = body.nextSyncToken;
  } while (pageToken);

  if (nextSyncToken) {
    await supabase
      .from('professionals')
      .update({ google_sync_token: nextSyncToken })
      .eq('id', professional.id);
  }

  return { upserted, removed };
}

function webhookUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_URL ?? '';
  if (!base.startsWith('https://')) return null; // Google exige HTTPS público
  return `${base.replace(/\/$/, '')}/api/google/calendar/webhook`;
}

/**
 * Registra um canal de push do Google (watch) apontando pro nosso webhook.
 * Best-effort: só roda quando NEXT_PUBLIC_URL é https (dev usa sync manual/cron).
 */
export async function setupWatch(professional: Professional): Promise<void> {
  const address = webhookUrl();
  if (!address) return;

  const channelId = crypto.randomUUID();
  const res = await calFetch(
    professional,
    `/calendars/${calId(professional)}/events/watch`,
    {
      method: 'POST',
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address,
        token: professional.id, // devolvido como X-Goog-Channel-Token
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`watch falhou: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as {
    resourceId?: string;
    expiration?: string;
  };
  const supabase = createServerClient();
  await supabase
    .from('professionals')
    .update({
      google_channel_id: channelId,
      google_resource_id: body.resourceId ?? null,
      google_channel_expiry: body.expiration
        ? new Date(Number(body.expiration)).toISOString()
        : null,
    })
    .eq('id', professional.id);
}

export async function stopWatch(professional: Professional): Promise<void> {
  if (!professional.google_channel_id || !professional.google_resource_id) {
    return;
  }
  await calFetch(professional, `/channels/stop`, {
    method: 'POST',
    body: JSON.stringify({
      id: professional.google_channel_id,
      resourceId: professional.google_resource_id,
    }),
  }).catch(() => {});
}
