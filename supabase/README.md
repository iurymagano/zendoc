# supabase/

Artefatos de banco de dados do IAzen para rodar no Supabase.

---

## schema.sql

**O que faz:** Schema completo do banco — todas as tabelas, índices, triggers e políticas RLS.

**Como usar:** Cole o conteúdo no SQL Editor do Supabase (projeto novo) e execute. Depois copie `Project URL`, `anon key` e `service_role key` de Project Settings → API para o `.env.local`.

**Cobre:** `professionals`, `availability_weekly`, `availability_exceptions`, `patients`, `appointments`, `reminders`, `conversation_history`, `personal_reminders`, `assistant_messages` e `assistant_pending_actions` (Assistente pessoal), `notifications` (sino do painel), a função `set_updated_at()`, a função/trigger `create_appointment_reminders()`, a função `my_professional_id()` e as policies RLS por profissional.

**Notas:** Referencia `auth.users` e `auth.uid()` do Supabase Auth. Não é totalmente idempotente — feito para projeto novo; rodar duas vezes falha em `create table`/`create policy` já existentes. Já inclui a coluna `patients.cpf` + índice único parcial `patients_professional_cpf_idx`.

---

## migrations/

Alterações incrementais para bancos **já provisionados** (projeto novo usa só `schema.sql`). Rodar em ordem no SQL Editor. Índice completo (um item por migration) em [migrations/README.md](migrations/README.md).

- `0001_patients_cpf.sql` — adiciona `patients.cpf` + índice único parcial por profissional. Idempotente (`if not exists`).
- `0002_google_calendar.sql` — colunas de conexão Google em `professionals`, `appointments.google_event_id` e `google_busy_events` (compromissos do Google que bloqueiam horários).
- `0003_recurrences.sql` — tabela `recurrences` (semanal/quinzenal) + `appointments.recurrence_id`; os appointments são materializados.
- `0004_services.sql` — tabela `services` (duração/preço), `appointments.service_id` e `professionals.buffer_min` (intervalo entre atendimentos).
- `0005_conversation_state.sql` — `conversation_state`: pausar a IA por contato (handoff).
- `0006_conversation_needs_attention.sql` — `needs_attention` em `conversation_state` (badge de conversas).
- `0007_patient_messaging_optout.sql` — `patients.messaging_opted_out` (LGPD: cliente não recebe lembretes).
- `0008_assistente_pessoal.sql` — **aditiva**: cria `personal_reminders` (lembretes pessoais enviados pelo cron de 1 min ao WhatsApp do próprio profissional) e `assistant_messages` (histórico do chat do Assistente, com `actions jsonb`), com índices e RLS `professional_id = my_professional_id()`. Tabela de histórico própria porque `conversation_history` é chaveada por telefone de cliente e alimenta `/conversas`.
- `0009_assistente_confirmacao.sql` — **aditiva**: cria `assistant_pending_actions` (cancelar/remarcar "preparado" pelo Assistente, com `request_id`, validade de 15 min e `status` pending/done/replaced) para o servidor exigir o "sim" numa mensagem posterior. RLS `professional_id = my_professional_id()`.
- `0010_notifications.sql` — **aditiva**: cria `notifications` (avisos dentro do app para o dono da conta: `type` com check, `title`, `body`, `data jsonb`, `dedupe_key` com `unique (professional_id, dedupe_key)`, `read_at`), índice do feed `(professional_id, created_at desc)`, índice parcial das não lidas e RLS `professional_id = my_professional_id()`.
