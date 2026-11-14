-- Assistente pessoal: confirmação em duas etapas para cancelar/remarcar. O
-- servidor guarda a ação "preparada" (o que o usuário viu) e só a executa
-- numa mensagem POSTERIOR do chat. Aditiva (só cria tabela/índice/RLS).
-- Rode no Supabase SQL Editor.

create table if not exists assistant_pending_actions (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  kind              text not null check (kind in ('cancel','reschedule')),
  appointment_id    uuid references appointments on delete cascade not null,
  new_starts_at     timestamptz,
  new_ends_at       timestamptz,
  reason            text,
  summary           text not null,
  -- id da requisição (mensagem do usuário) em que foi preparada: confirmar na
  -- MESMA requisição é recusado pelo servidor.
  request_id        text not null,
  status            text not null default 'pending' check (
                      status in ('pending','done','replaced')
                    ),
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null,
  constraint reschedule_needs_times check (
    kind <> 'reschedule'
    or (new_starts_at is not null and new_ends_at is not null and new_ends_at > new_starts_at)
  )
);

create index if not exists assistant_pending_actions_lookup_idx
  on assistant_pending_actions(professional_id, created_at desc)
  where status = 'pending';

alter table assistant_pending_actions enable row level security;

drop policy if exists "assistant_pending_actions: own data" on assistant_pending_actions;
create policy "assistant_pending_actions: own data"
  on assistant_pending_actions for all using (professional_id = my_professional_id());
