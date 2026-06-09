-- Tipos de serviço (avaliação, retorno, sessão…) com duração e preço próprios,
-- + intervalo entre atendimentos (buffer). Rode no Supabase SQL Editor.

create table if not exists services (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  name              text not null,
  duration_min      int not null check (duration_min between 5 and 600),
  price_cents       int check (price_cents is null or price_cents >= 0),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (professional_id, name)
);

create index if not exists services_professional_idx
  on services(professional_id) where active;

-- Liga o appointment ao serviço escolhido (rótulo + preço; duração já vai no horário).
alter table appointments
  add column if not exists service_id uuid references services on delete set null;

-- Intervalo (minutos) entre atendimentos, respeitado nos slots oferecidos pela IA.
alter table professionals
  add column if not exists buffer_min int not null default 0;

-- RLS coerente com as demais tabelas.
alter table services enable row level security;

drop policy if exists "services: own data" on services;
create policy "services: own data"
  on services for all using (professional_id = my_professional_id());
