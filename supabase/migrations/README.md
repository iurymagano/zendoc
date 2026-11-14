# supabase/migrations/

Alterações incrementais do banco para projetos **já provisionados** (um projeto novo usa só `../schema.sql`, que já as inclui). Rodar em ordem, uma vez, no SQL Editor do Supabase.

Regra do projeto: migration em produção é **aditiva** (criar tabela/coluna/índice/política); nunca `DROP`, `DELETE` nem `UPDATE` sobre dados existentes. Toda tabela nova habilita RLS e entra também em `../schema.sql`.

---

- `0001_patients_cpf.sql` — adiciona `patients.cpf` + índice único parcial por profissional. Idempotente (`if not exists`).
- `0002_google_calendar.sql` — colunas de conexão do Google Agenda em `professionals`, `appointments.google_event_id` e a tabela `google_busy_events` (compromissos do Google que bloqueiam horários).
- `0003_recurrences.sql` — tabela `recurrences` (semanal/quinzenal) + `appointments.recurrence_id`; os atendimentos da série são materializados.
- `0004_services.sql` — tabela `services` (duração/preço), `appointments.service_id` e `professionals.buffer_min` (intervalo entre atendimentos).
- `0005_conversation_state.sql` — tabela `conversation_state`: pausar a IA por contato (handoff para o profissional).
- `0006_conversation_needs_attention.sql` — `needs_attention` em `conversation_state` (badge de conversas que pedem atenção).
- `0007_patient_messaging_optout.sql` — `patients.messaging_opted_out` (LGPD: o cliente pode não receber lembretes).
- `0008_assistente_pessoal.sql` — tabelas `personal_reminders` (lembretes pessoais enviados pelo cron de 1 min ao WhatsApp do próprio profissional) e `assistant_messages` (histórico do chat do Assistente, com `actions jsonb`), com índices e RLS.
- `0009_assistente_confirmacao.sql` — tabela `assistant_pending_actions` (cancelar/remarcar "preparado" pelo Assistente, com `request_id`, validade de 15 min e `status` pending/done/replaced) para o servidor exigir o "sim" numa mensagem posterior. RLS `professional_id = my_professional_id()`.
