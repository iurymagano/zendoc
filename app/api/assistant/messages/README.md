# app/api/assistant/messages/

Histórico do chat do Assistente.

## route.ts

**Endpoint:** `GET /api/assistant/messages`

**Resposta 200:** `{ "messages": [{ "id", "role": "user|assistant", "content", "actions": string[]|null, "created_at" }] }`
— as 50 mais recentes, em ordem cronológica (mais antiga primeiro).

**Erros:** 401, 404 (sem perfil), 500.

**Depende de:** `@/auth`, `@/lib/assistant/access`, `@/lib/supabase`

**Notas:** lê `assistant_messages` (não `conversation_history`, que é das conversas de
clientes no WhatsApp e alimenta a caixa "Conversas").
