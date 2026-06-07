# app/api/webhooks/

Webhooks de provedores externos. Rotas **públicas** (não passam por sessão; o
`/api` é excluído do middleware `proxy.ts`), autenticadas pela assinatura/segredo
do próprio provedor.

## Subpastas

- [stripe/](./stripe/) — eventos de assinatura do Stripe (sincroniza
  `plan_status` / `ai_enabled` em `professionals`).

> Nota: o webhook do WhatsApp (Evolution) vive em
> [../whatsapp/webhook/](../whatsapp/webhook/), por proximidade com as demais
> rotas de WhatsApp.
