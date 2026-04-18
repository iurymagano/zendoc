# app/api/availability/exceptions/

Endpoints de exceções pontuais na agenda (folgas, horários diferentes, dias
extras). Ver descrição completa dos payloads no
[README pai](../README.md#exceptionsrouter-ts).

## route.ts

**O que faz:** `GET` (com filtros opcionais `from`/`to` em `YYYY-MM-DD`) e
`POST` (upsert por `professional_id,date`) das exceções.

**Depende de:** `@/auth`, `@/lib/supabase`, `zod`.

**Notas:** no `POST`, quando `type = day_off`, os campos `start_time`,
`end_time` e `slot_duration` são normalizados para `null` antes do upsert —
o cliente pode enviar qualquer valor que eles são descartados.

## Subpastas

- [\[id\]/](./[id]/) — rota dinâmica para DELETE por ID da exceção.
