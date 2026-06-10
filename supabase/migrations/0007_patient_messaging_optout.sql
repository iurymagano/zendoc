-- LGPD: oposição do paciente ao recebimento de mensagens ATIVAS (lembretes).
-- Conversas iniciadas pelo paciente seguem funcionando. Rode no Supabase SQL Editor.

alter table patients
  add column if not exists messaging_opted_out boolean not null default false;
