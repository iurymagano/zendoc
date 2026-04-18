# app/api/patients/[id]/

Rota dinâmica para operações em um paciente específico.

## route.ts

**Endpoints:**

- `GET /api/patients/:id` — retorna `{ patient }`. 404 se não for do
  profissional logado.
- `PATCH /api/patients/:id` — atualiza parcial (qualquer subconjunto de
  `name`, `phone`, `notes`). Envio vazio → 400.
- `DELETE /api/patients/:id` — remove. Idempotente (não erra se já não
  existe). A FK em `appointments.patient_id` é `ON DELETE SET NULL`, então
  agendamentos antigos viram "paciente removido" mas preservam `patient_name`
  e `patient_phone` desnormalizados.

**Autenticação:** todas as operações filtram por `professional_id` derivado
da sessão, como defesa em profundidade (o cliente usa service key e bypassa
RLS).

**Erros:**

- `409` no `PATCH` se o novo telefone colidir com outro paciente do mesmo
  profissional.
