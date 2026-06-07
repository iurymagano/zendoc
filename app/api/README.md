# app/api/

API Routes do Next.js. Cada subpasta vira um endpoint REST.

## Endpoints

### `POST /api/auth/register`

Arquivo: [auth/register/route.ts](./auth/register/route.ts)

**Payload:**

```json
{ "email": "user@example.com", "password": "minimo8chars" }
```

**Resposta 200:** `{ "user_id": "uuid" }`

**Erros:** 400 (validação ou email duplicado)

### `GET/POST /api/auth/[...nextauth]`

Arquivo: [auth/[...nextauth]/route.ts](./auth/[...nextauth]/route.ts)

Handler do NextAuth v5 — expõe `/api/auth/signin`, `/api/auth/callback`,
`/api/auth/session`, etc. Não editar manualmente.

### `POST /api/onboarding/profile`

Arquivo: [onboarding/profile/route.ts](./onboarding/profile/route.ts)

Cria ou atualiza o registro em `professionals` para o usuário logado. Define
`plan_status = 'trialing'` e `trial_ends_at = now() + 7 dias`.

### `GET/POST /api/availability/weekly`

Arquivo: [availability/weekly/route.ts](./availability/weekly/route.ts)

CRUD da rotina semanal. `POST` faz "replace all" — substitui todos os blocos
do profissional pelo payload. Detalhes em [availability/README.md](./availability/README.md).

### `GET/POST /api/availability/exceptions` e `DELETE /api/availability/exceptions/:id`

Arquivos: [availability/exceptions/route.ts](./availability/exceptions/route.ts),
[availability/exceptions/[id]/route.ts](./availability/exceptions/[id]/route.ts)

Exceções pontuais (folgas, horários diferentes, dias extras). Detalhes em
[availability/README.md](./availability/README.md).

### `POST /api/ai/test`

Arquivo: [ai/test/route.ts](./ai/test/route.ts)

Endpoint de teste manual para o fluxo da IA sem passar pelo WhatsApp real.
Simula uma mensagem recebida de `phone` e retorna o texto que seria enviado de
volta. Detalhes em [ai/README.md](./ai/README.md).

### `GET|POST /api/reminders/dispatch`

Arquivo: [reminders/dispatch/route.ts](./reminders/dispatch/route.ts)

Endpoint chamado pelo Vercel Cron (a cada 15 min) para disparar os lembretes
pendentes. Autenticado via `Authorization: Bearer ${CRON_SECRET}`. Detalhes em
[reminders/README.md](./reminders/README.md).

### `GET|POST /api/patients` e `GET|PATCH|DELETE /api/patients/:id`

Arquivos: [patients/route.ts](./patients/route.ts),
[patients/[id]/route.ts](./patients/[id]/route.ts)

CRUD de pacientes do profissional logado. `GET` aceita `?q=` para busca por
nome/telefone. Detalhes em [patients/README.md](./patients/README.md).

### WhatsApp — `/api/whatsapp/*`

Arquivos: [whatsapp/connect/route.ts](./whatsapp/connect/route.ts),
[whatsapp/status/route.ts](./whatsapp/status/route.ts),
[whatsapp/disconnect/route.ts](./whatsapp/disconnect/route.ts),
[whatsapp/webhook/route.ts](./whatsapp/webhook/route.ts)

Pareamento Evolution API: `POST /connect` cria/reseta instância e retorna
QR, `GET /status` devolve o estado da conexão, `POST /disconnect` remove a
instância. O `POST /webhook` é público (chamado pela Evolution) e roteia
mensagens para a IA. Detalhes em [whatsapp/README.md](./whatsapp/README.md).

### `GET|POST /api/appointments`, `GET|PATCH /api/appointments/:id`, `POST /api/appointments/:id/cancel`

Arquivos: [appointments/route.ts](./appointments/route.ts),
[appointments/[id]/route.ts](./appointments/[id]/route.ts),
[appointments/[id]/cancel/route.ts](./appointments/[id]/cancel/route.ts)

CRUD manual de agendamentos + endpoint dedicado de cancelamento com motivo
(grava `cancelled_by = 'professional'`). Checagem de sobreposição via
[lib/appointments/conflicts.ts](../../lib/appointments/conflicts.ts). Detalhes
em [appointments/README.md](./appointments/README.md).

### Billing (Stripe) — `/api/billing/*` e `/api/webhooks/stripe`

Arquivos: [billing/checkout/route.ts](./billing/checkout/route.ts),
[billing/portal/route.ts](./billing/portal/route.ts),
[webhooks/stripe/route.ts](./webhooks/stripe/route.ts)

Assinatura R$297/mês (trial 7d). `POST /billing/checkout` cria a Checkout
Session, `POST /billing/portal` abre o Billing Portal (ambos exigem sessão e
devolvem `{ url }`). `POST /webhooks/stripe` é **público** (validado por
assinatura) e sincroniza `plan_status`/`ai_enabled`. Detalhes em
[billing/README.md](./billing/README.md) e
[webhooks/README.md](./webhooks/README.md).

## Autenticação

Todas as rotas (exceto o catch-all do NextAuth) começam com
`const session = await auth()` → 401 se não autenticado. Rotas que precisam do
perfil do profissional também checam existência em `professionals` → 404 se
não encontrado.
