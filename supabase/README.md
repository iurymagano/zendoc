# supabase/

Artefatos de banco de dados do IAzen para rodar no Supabase.

---

## schema.sql

**O que faz:** Schema completo do banco — todas as tabelas, índices, triggers e políticas RLS.

**Como usar:** Cole o conteúdo no SQL Editor do Supabase (projeto novo) e execute. Depois copie `Project URL`, `anon key` e `service_role key` de Project Settings → API para o `.env.local`.

**Cobre:** `professionals`, `availability_weekly`, `availability_exceptions`, `patients`, `appointments`, `reminders`, `conversation_history`, a função `set_updated_at()`, a função/trigger `create_appointment_reminders()`, a função `my_professional_id()` e as policies RLS por profissional.

**Notas:** Referencia `auth.users` e `auth.uid()` do Supabase Auth. Não é totalmente idempotente — feito para projeto novo; rodar duas vezes falha em `create table`/`create policy` já existentes. Já inclui a coluna `patients.cpf` + índice único parcial `patients_professional_cpf_idx`.

---

## migrations/

Alterações incrementais para bancos **já provisionados** (projeto novo usa só `schema.sql`). Rodar em ordem no SQL Editor.

- `0001_patients_cpf.sql` — adiciona `patients.cpf` + índice único parcial por profissional. Idempotente (`if not exists`).
