-- Sinaliza que uma conversa precisa de resposta humana (a IA não soube responder
-- ou escalou). Rode no Supabase SQL Editor.

alter table conversation_state
  add column if not exists needs_attention boolean not null default false;

create index if not exists conversation_state_attention_idx
  on conversation_state(professional_id) where needs_attention;
