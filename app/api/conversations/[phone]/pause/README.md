# app/api/conversations/[phone]/pause/

## route.ts

**`POST { paused: boolean }`** — pausa ou retoma a IA naquele contato (handoff).
Upsert em `conversation_state` via `setConversationPaused`. Quando pausada, o
webhook do WhatsApp guarda a mensagem recebida mas não responde.
