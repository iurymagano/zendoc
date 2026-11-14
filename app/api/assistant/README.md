# app/api/assistant/

Endpoints do **Assistente pessoal**: o chat em que o próprio profissional pede à IA para
cuidar da agenda e dos lembretes dele. Toda rota começa com `auth()` (401) e usa sempre o
`professional_id` da sessão — nunca um id vindo do corpo/URL.

## Subpastas

- [chat/](./chat/) — `POST /api/assistant/chat`: um turno de conversa (com tool use).
- [messages/](./messages/) — `GET /api/assistant/messages`: histórico do chat.
- [reminders/](./reminders/) — `GET /api/assistant/reminders` e
  `POST /api/assistant/reminders/:id/cancel`: lembretes pessoais.

Lógica de IA, ferramentas e banco: [lib/assistant/](../../../lib/assistant/README.md).
UI: [/assistente](../../(dashboard)/assistente/README.md).
