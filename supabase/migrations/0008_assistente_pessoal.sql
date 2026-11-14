-- Assistente pessoal: lembretes pessoais do profissional + histórico do chat
-- com a IA. Aditiva (só cria tabelas/índices/RLS). Rode no Supabase SQL Editor.

-- Lembretes pessoais ("me lembra de ligar pro contador amanhã às 9h"): enviados
-- pelo cron de 1 min (/api/reminders/dispatch) via WhatsApp conectado, para o
-- telefone do próprio profissional (professionals.phone).
create table if not exists personal_reminders (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  text              text not null check (char_length(text) between 1 and 500),
  remind_at         timestamptz not null,
  status            text not null default 'pending' check (
                      status in ('pending','sent','failed','cancelled')
                    ),
  sent_at           timestamptz,
  error_message     text,
  created_at        timestamptz not null default now()
);

create index if not exists personal_reminders_due_idx
  on personal_reminders(remind_at)
  where status = 'pending';

create index if not exists personal_reminders_professional_idx
  on personal_reminders(professional_id, remind_at);

-- Histórico do chat do Assistente pessoal. Tabela própria (e não
-- conversation_history) porque aquela é chaveada por telefone de paciente e
-- alimenta a caixa de entrada /conversas.
create table if not exists assistant_messages (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  role              text not null check (role in ('user','assistant')),
  content           text not null,
  actions           jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists assistant_messages_lookup_idx
  on assistant_messages(professional_id, created_at desc);

-- RLS coerente com as demais tabelas.
alter table personal_reminders enable row level security;
alter table assistant_messages enable row level security;

drop policy if exists "personal_reminders: own data" on personal_reminders;
create policy "personal_reminders: own data"
  on personal_reminders for all using (professional_id = my_professional_id());

drop policy if exists "assistant_messages: own data" on assistant_messages;
create policy "assistant_messages: own data"
  on assistant_messages for all using (professional_id = my_professional_id());
