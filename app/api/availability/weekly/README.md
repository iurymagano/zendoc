# app/api/availability/weekly/

CRUD da rotina semanal de disponibilidade (`availability_weekly`).

## route.ts

**O que faz:**

- `GET` — lista todos os blocos do profissional logado, ordenados por
  `weekday` e `start_time`.
- `POST` — substitui todos os blocos do profissional. Apaga tudo e insere o
  payload. Se `blocks: []`, deixa a tabela vazia para esse profissional (equivale
  a "não atendo nunca").

**Exporta:** `GET()`, `POST(req)` → `NextResponse`

**Depende de:** `@/auth`, `@/lib/supabase`, `zod`

**Notas:**

- Usa `SUPABASE_SERVICE_KEY` (bypassa RLS) — sempre filtra por
  `professional_id` derivado da sessão.
- `block_type='lunch'` é permitido aqui, mas o `getAvailableSlots` filtra
  (CLAUDE.md → "disponibilidade").
- Validações (Zod): `weekday 0..6`, `start_time < end_time`,
  `slot_duration 15..240`, formato `HH:MM` para horários.
