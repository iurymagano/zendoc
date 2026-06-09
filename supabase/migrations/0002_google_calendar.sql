-- Google Calendar — integração bidirecional (mão-dupla)
-- Rode manualmente no Supabase SQL Editor.

-- 1) Credenciais e estado da conexão Google, por profissional.
alter table professionals
  add column if not exists google_calendar_connected boolean not null default false,
  add column if not exists google_email             text,
  add column if not exists google_refresh_token     text,
  add column if not exists google_access_token       text,
  add column if not exists google_token_expiry        timestamptz,
  add column if not exists google_calendar_id         text not null default 'primary',
  add column if not exists google_sync_token          text,
  add column if not exists google_channel_id          text,
  add column if not exists google_resource_id         text,
  add column if not exists google_channel_expiry      timestamptz;

-- 2) Espelho do appointment no Google (para update/delete idempotente).
alter table appointments
  add column if not exists google_event_id text;

-- 3) Eventos pessoais do profissional puxados do Google.
--    Não são consultas do IAzen — apenas bloqueiam disponibilidade e
--    aparecem read-only no calendário. A tag iazenAppointmentId nos eventos
--    que NÓS criamos garante que eles nunca caiam aqui (evita loop).
create table if not exists google_busy_events (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  google_event_id   text not null,
  summary           text,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  all_day           boolean not null default false,
  updated_at        timestamptz not null default now(),
  unique (professional_id, google_event_id)
);

create index if not exists google_busy_events_window_idx
  on google_busy_events(professional_id, starts_at, ends_at);

-- RLS coerente com as demais tabelas (dono = my_professional_id()).
alter table google_busy_events enable row level security;

drop policy if exists "google_busy_events: own data" on google_busy_events;
create policy "google_busy_events: own data"
  on google_busy_events for all using (professional_id = my_professional_id());
