-- Estado por conversa: permite PAUSAR a IA em um contato específico (handoff),
-- para o profissional assumir manualmente. Rode no Supabase SQL Editor.

create table if not exists conversation_state (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  patient_phone     text not null,
  ai_paused         boolean not null default false,
  updated_at        timestamptz not null default now(),
  unique (professional_id, patient_phone)
);

alter table conversation_state enable row level security;

drop policy if exists "conversation_state: own data" on conversation_state;
create policy "conversation_state: own data"
  on conversation_state for all using (professional_id = my_professional_id());
