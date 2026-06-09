-- Consultas recorrentes (mesmo horário toda semana / quinzena).
-- Rode manualmente no Supabase SQL Editor.
--
-- Modelo: a recorrência guarda a "regra"; os appointments são MATERIALIZADOS
-- (linhas reais), então reaproveitam lembretes, checagem de conflito e o sync
-- do Google sem tratamento especial. Um cron mantém ~8 semanas à frente.

create table if not exists recurrences (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  patient_id        uuid references patients on delete set null,
  patient_name      text not null,
  patient_phone     text not null,
  start_date        date not null,                 -- data da 1ª sessão (âncora da cadência)
  weekday           int not null check (weekday between 0 and 6),
  start_time        time not null,
  end_time          time not null,
  interval_weeks    int not null default 1 check (interval_weeks in (1, 2)), -- 1=semanal, 2=quinzenal
  until             date,                           -- término opcional (inclusive)
  active            boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now(),
  constraint valid_recurrence_time check (end_time > start_time)
);

create index if not exists recurrences_active_idx
  on recurrences(professional_id) where active;

-- Liga cada appointment materializado à sua série.
alter table appointments
  add column if not exists recurrence_id uuid references recurrences on delete set null;

create index if not exists appointments_recurrence_idx
  on appointments(recurrence_id) where recurrence_id is not null;

-- RLS coerente com as demais tabelas.
alter table recurrences enable row level security;

drop policy if exists "recurrences: own data" on recurrences;
create policy "recurrences: own data"
  on recurrences for all using (professional_id = my_professional_id());
