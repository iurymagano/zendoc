# app/api/conversations/attention-count/

## route.ts

**`GET /api/conversations/attention-count`** — `{ count }` de conversas que
precisam de resposta humana (`conversation_state.needs_attention = true`).
Consulta leve (count head). Usada pelo badge de notificação no Navbar (poll 30s).
Rota estática — resolve antes de `/[phone]`.
