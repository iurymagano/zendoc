# app/api/availability/exceptions/[id]/

Rota dinâmica para operações em uma exceção específica.

## route.ts

**O que faz:** `DELETE /api/availability/exceptions/:id` — remove a exceção
pelo ID. Além do `id`, filtra por `professional_id` (derivado da sessão) como
defesa em profundidade, já que o cliente usa `SUPABASE_SERVICE_KEY` e portanto
bypassa RLS.

**Depende de:** `@/auth`, `@/lib/supabase`.

**Respostas:**

- `200 { ok: true }` — sucesso (mesmo que o ID não exista — idempotente).
- `401` — sem sessão.
- `404` — perfil não encontrado em `professionals`.
- `500` — erro do Supabase.
