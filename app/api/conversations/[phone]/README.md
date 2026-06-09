# app/api/conversations/[phone]/

## route.ts

**`GET /api/conversations/[phone]`** — mensagens da conversa (ordem cronológica,
até 200), nome do paciente e `ai_paused`. `phone` vem `encodeURIComponent`.

## Subpastas

- [pause/](./pause/) — `POST { paused: boolean }` pausa/retoma a IA no contato.
- [send/](./send/) — `POST { message }` envia mensagem manual pelo WhatsApp e
  grava como `assistant`.
