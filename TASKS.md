# TASKS — Zendoc

Backlog vivo do projeto. **Fonte única da verdade** do que está feito e do que
falta. Sempre marque `- [x]` ao concluir uma tarefa e adicione `- [ ]` quando
descobrir algo novo. Regra completa em [CLAUDE.md](CLAUDE.md).

Legenda:

- `- [x]` concluído
- `- [ ]` pendente

---

## Sprint 0 — Validação (concluído)

- [x] Definição de público-alvo e proposta de valor
- [x] Definição de stack técnica
- [x] Definição de preço e modelo de trial
- [x] Schema do banco desenhado
- [x] Setup inicial do repositório Git

---

## Sprint 1 — Fundação técnica (em andamento)

- [x] Setup Next.js 14 + Tailwind + TypeScript
- [x] Instalação e configuração do shadcn/ui
- [x] Rodar schema SQL no Supabase (confirmar execução em produção)
- [x] `auth.ts` (NextAuth v5 — email/senha + Google)
- [x] `middleware.ts` de proteção de rotas
- [x] Tela de login (`app/(auth)/login/page.tsx`)
- [x] Tela de cadastro (`app/(auth)/register/page.tsx`)
- [x] `POST /api/auth/register`
- [x] Onboarding passo 1 — dados pessoais (`app/onboarding/step-1/page.tsx`)
- [x] Onboarding passo 2 — perfil do consultório (`app/onboarding/step-2/page.tsx`)
- [x] `POST /api/onboarding/profile`
- [x] Dashboard base (`app/(dashboard)/dashboard/page.tsx`)
- [ ] Deploy na Vercel (primeiro deploy de validação)

---

## Sprint 2 — Core do produto (em andamento)

### Disponibilidade

- [x] Tela de disponibilidade semanal (`app/(dashboard)/configuracoes/disponibilidade/page.tsx`)
- [x] `GET|POST /api/availability/weekly`
- [x] Componente `WeekdayRow`
- [x] Tela de exceções por data (`availability_exceptions`)
- [x] `GET|POST /api/availability/exceptions`
- [x] `DELETE /api/availability/exceptions/[id]`
- [x] `lib/availability/slots.ts` — cálculo de slots disponíveis (14 dias)

### WhatsApp

- [ ] Deploy Evolution API no Railway
- [ ] Tela de conexão WhatsApp com QR Code (polling a cada 30s)
- [ ] `lib/zapi/client.ts` — createInstance, getQRCode, getConnectionStatus, sendWhatsAppMessage
- [ ] `POST /api/whatsapp/webhook` — recepção de mensagens

### IA

- [x] `lib/ai/prompt-builder.ts`
- [x] `lib/ai/processor.ts`
- [x] `lib/ai/executor.ts` (book / cancel / reschedule)
- [x] Persistência de `conversation_history` (últimas 10 mensagens)
- [x] `POST /api/ai/test` — endpoint para testar o fluxo sem WhatsApp

### Lembretes

- [x] Cron de lembretes (Vercel Cron Jobs, agendado em `vercel.json`)
- [x] `GET|POST /api/reminders/dispatch` — dispara `24h` e `2h` pendentes
- [x] `lib/zapi/client.ts` — `sendWhatsAppMessage` (stub testável)
- [ ] Configurar `CRON_SECRET` em produção (Vercel env vars)

---

## Sprint 3 — Beta (em andamento)

- [x] Listagem de agendamentos (agenda semanal)
  - [x] `GET /api/appointments?from&to`
  - [x] Página `/agenda` com navegação de semanas e agrupamento por dia
- [ ] Criação/edição manual de agendamento
- [ ] Cancelamento manual com motivo
- [x] Tela de pacientes (CRUD básico)
  - [x] `GET|POST /api/patients` (com busca `?q=`)
  - [x] `GET|PATCH|DELETE /api/patients/[id]`
  - [x] Página `/pacientes` com busca + form inline de criar/editar
- [ ] Fluxo de aprovação (`requires_approval = true`)
- [ ] Banner de status do plano (`past_due`, trial expirando)
- [ ] Onboarding de 5 beta testers reais
- [ ] Coleta de feedback estruturada

---

## Sprint 4 — Pagamentos (pendente)

- [ ] Setup Stripe (produto + price R$197/mês)
- [ ] `POST /api/billing/checkout`
- [ ] `POST /api/webhooks/stripe` (checkout.session.completed, invoice.paid, payment_failed, subscription.deleted)
- [ ] Tela de "gerenciar assinatura" (portal Stripe)
- [ ] Bloqueio de IA quando `plan_status = past_due` ou `cancelled`
- [ ] Aviso de trial terminando no dashboard

---

## Sprint 5 — Crescimento (pendente)

- [ ] Landing page pública com conversão
- [ ] Relatório semanal por email (agendamentos, cancelamentos, no-show)
- [ ] Integração com Google Calendar (sync bidirecional)
- [ ] Programa de indicação
- [ ] Métricas de produto (conversão trial → paid, churn)

---

## Backlog lateral (não priorizado)

- [ ] Dark mode no dashboard
- [ ] App mobile (PWA)
- [ ] Multi-profissional (consultórios com 2+ profissionais)
- [ ] Teleconsulta com link automático
