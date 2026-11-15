-- Notificações dentro do app (sino do painel): avisos para o profissional dono
-- da conta quando algo acontece sem ele ver (cliente desmarcou, IA agendou,
-- WhatsApp caiu, lembrete que falhou...). Aditiva (só cria tabela/índice/RLS).
-- Rode no Supabase SQL Editor.

create table if not exists notifications (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  type              text not null check (type in (
                      'appointment_cancelled',
                      'appointment_rescheduled',
                      'appointment_booked',
                      'appointment_pending_approval',
                      'appointment_confirmed',
                      'appointment_conflict',
                      'conversation_attention',
                      'whatsapp_disconnected',
                      'message_failed'
                    )),
  title             text not null check (char_length(title) between 1 and 200),
  body              text not null default '' check (char_length(body) <= 1000),
  -- ids/datas usados para navegar (appointment_id, starts_at, patient_phone...)
  data              jsonb not null default '{}'::jsonb,
  -- evita duplicata do mesmo evento (ex.: webhook reenviado). Nulo = sem dedupe
  -- (nulos não colidem na unique).
  dedupe_key        text,
  read_at           timestamptz,
  created_at        timestamptz not null default now(),
  unique (professional_id, dedupe_key)
);

create index if not exists notifications_feed_idx
  on notifications(professional_id, created_at desc);
create index if not exists notifications_unread_idx
  on notifications(professional_id, created_at desc)
  where read_at is null;

alter table notifications enable row level security;

drop policy if exists "notifications: own data" on notifications;
create policy "notifications: own data"
  on notifications for all using (professional_id = my_professional_id());
