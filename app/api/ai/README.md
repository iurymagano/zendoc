# app/api/ai/

Endpoints relacionados ao fluxo da IA (Claude). Hoje contém apenas a rota de
teste manual — o fluxo produtivo entra via
[`/api/whatsapp/webhook`](../../../CLAUDE.md#whatsapp--webhook-e-cliente) que
chama `lib/ai/processor` internamente.

## Subpastas

- [test/](./test/) — `POST /api/ai/test` para testar o processor sem WhatsApp.
