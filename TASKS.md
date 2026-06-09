# TASKS — IAzen

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
- [x] `middleware.ts` de proteção de rotas (migrado para `proxy.ts` no Next 16)
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

- [x] Deploy Evolution API no Railway
- [x] Tela de conexão WhatsApp com QR Code (polling via webhook)
- [x] `lib/zapi/client.ts` — createInstance (com secret no webhook),
  getQRCode, getConnectionStatus, deleteInstance, sendWhatsAppMessage,
  `EvolutionInstanceNotFoundError`
- [x] `POST /api/whatsapp/connect` — cria instância e retorna `instanceId`
  (QR não vem mais sincronamente)
- [x] `GET /api/whatsapp/status` — devolve `connected`, `instanceId` e
  `qrcode` (vindo do webhook via `pending_qrcode`)
- [x] `POST /api/whatsapp/disconnect` — remove instância e limpa flags
- [x] `POST /api/whatsapp/webhook?secret=…` — autenticado por query secret,
  despacha `qrcode.updated`, `connection.update` e `messages.upsert`
- [x] Migration SQL: `pending_qrcode` + `pending_qrcode_at` em `professionals`
- [x] Env `WEBHOOK_SECRET` em `.env.example` e `.env.local`
- [ ] Testar fluxo end-to-end: rodar migration, levantar tunnel, parear
  WhatsApp, mandar mensagem de um número externo, confirmar resposta da
  IA e persistência de appointment

### IA

- [x] `lib/ai/prompt-builder.ts`
- [x] `lib/ai/processor.ts`
- [x] `lib/ai/executor.ts` (book / cancel / reschedule)
- [x] Persistência de `conversation_history` (últimas 10 mensagens)
- [x] `POST /api/ai/test` — endpoint para testar o fluxo sem WhatsApp
- [x] Chat de teste na UI (`/configuracoes/testar-ia`) — simula um paciente e
  conversa com a IA sem WhatsApp; usa telefone fake e consome `/api/ai/test`
  - [x] Mostra a ação da IA por resposta (`processWhatsAppMessage` agora devolve
    `AIResponse`; `/api/ai/test` expõe `action`) + botão "Limpar histórico" (DELETE)
  - [x] Fix: IA chutava o ano (marcava em 2024). `getAvailableSlots` devolve
    `Slot{start,end}` e o prompt lista o ISO exato p/ a IA copiar verbatim
  - [x] Parsing robusto da resposta da IA (tira ```json```, extrai `{…}`) +
    prompt com exemplos few-shot — fim do fallback "não entendi" com Haiku
  - [x] Contexto do paciente no prompt (`buildPatientContext`): nome, consultas
    realizadas, faltas, próxima consulta marcada e notas, p/ números já cadastrados
  - [x] Inbox persistente no chat de teste: lista de conversas (GET), retoma a
    selecionada (localStorage), múltiplas conversas — simula o WhatsApp

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
- [x] Criação/edição manual de agendamento
  - [x] `POST /api/appointments` (com checagem de conflito)
  - [x] `PATCH /api/appointments/[id]` (status, horário, paciente, notas)
  - [x] Formulário inline em `/agenda` reutilizado para criar e editar
  - [x] Autocomplete de pacientes cadastrados no campo "nome"
  - [x] Ações por status: Confirmar, Aprovar, Não compareceu, Editar
  - [x] `lib/appointments/conflicts.ts` — checagem de sobreposição reutilizável
- [x] Cancelamento manual com motivo
  - [x] `POST /api/appointments/[id]/cancel` (grava `cancelled_by=professional`)
  - [x] UI: confirm + prompt de motivo
- [x] Tela de pacientes (CRUD básico)
  - [x] `GET|POST /api/patients` (com busca `?q=`)
  - [x] `GET|PATCH|DELETE /api/patients/[id]`
  - [x] Página `/pacientes` com busca + form inline de criar/editar
- [x] Fluxo de aprovação (`requires_approval = true`)
  - [x] Ações "Aprovar"/"Rejeitar" em `/agenda` para itens `pending_approval`
    (aprovar → `PATCH status=scheduled`; rejeitar → `POST /cancel`)
- [x] Banner de status do plano (`past_due`, trial expirando)
  - [x] Componente `components/billing/PlanStatusBanner` (past_due, cancelled,
    trial_ending ≤3 dias, trial_expired)
  - [x] Integrado no `/dashboard`
- [ ] Onboarding de 5 beta testers reais
- [ ] Coleta de feedback estruturada

---

## Sprint 3.5 — Rebrand IAzen + identidade visual (em andamento)

### Rebrand de strings (Zendoc → IAzen)

- [x] `package.json` + `package-lock.json` — campo `name`
- [x] `app/layout.tsx` — metadata (title + description) e fontes
- [x] `app/page.tsx` — landing pública
- [x] `app/(auth)/layout.tsx` e `app/(auth)/login/page.tsx`
- [x] `app/onboarding/layout.tsx` + `step-1/page.tsx` + `step-2/page.tsx`
  (inclui chave `iazen:onboarding:step1` no sessionStorage)
- [x] `components/billing/PlanStatusBanner.tsx`
- [x] `README.md` + `AGENTS.md`
- [x] Todos os READMEs de pasta que citavam Zendoc
  (`app/README.md`, `app/onboarding/README.md`, `app/(auth)/README.md`,
  `components/ui/README.md`, `lib/zapi/README.md`)
- [ ] Renomear o diretório do repositório `zendoc/` → `iazen/` (decisão à
  parte — envolve atualizar paths locais e git remote)

### Identidade visual

- [x] Fontes Space Grotesk (display) + Inter (body) via `next/font/google`
  em `app/layout.tsx`
- [x] Tokens `--ia-*` em `app/globals.css` (cores hex + família de fonte)
- [x] Mapear tokens IAzen para os tokens shadcn (`--primary`, `--background`,
  `--foreground`, `--accent`, `--muted`, `--border`, `--ring`)
- [x] Headings com `font-display` + `letter-spacing: -0.03em`
- [x] Corpo de texto com `font-body` + `line-height: 1.6`
- [x] Botão primário com fundo `#4F6EF7` + `border-radius: 8px`
  (via `--primary` + `--radius: 0.5rem`)
- [x] Landing page com hero escuro (`#0A0A0F`, texto branco, acento azul)
  - [x] Wrapper com `.dark` para trocar todos os tokens shadcn
  - [x] Header sticky com `backdrop-blur` + CTAs
  - [x] Hero central com badge "Secretária virtual com IA", headline em duas
    linhas (segunda com `text-primary`) e dois CTAs
  - [x] Footer com copyright e nichos atendidos
  - [x] Gradientes radiais decorativos (azul + violeta) atrás do hero
  - [x] Headline com gradiente azul→violeta em `bg-clip-text`
  - [x] Grid de 3 features com eyebrow numerado (01/02/03)
  - [x] Seção "Feito para" listando nichos atendidos
- [x] Componente `<Logo>` reutilizável (components/brand/) — ponto violeta
  com halo + texto Space Grotesk, três tamanhos
- [x] Shell do dashboard (components/dashboard/Navbar.tsx) — navbar sticky
  com logo, nav das áreas e botão Sair, com variante mobile
- [x] `<PageHeader>` padronizado (eyebrow mono, título Space Grotesk, slot
  de ações) usado em todas as páginas internas
- [x] `app/(dashboard)/layout.tsx` com Navbar + container `max-w-6xl` —
  páginas internas não repetem wrapper
- [x] Auth layout split-screen (lado dark com gradientes + tagline em
  gradiente, lado com card do form)
- [x] Onboarding layout com logo, card `rounded-2xl` e gradiente sutil
- [x] StepHeader com barra de progresso em gradiente azul→violeta
- [x] Dashboard com `StatCard` (próximas consultas, pacientes, blocos ativos)
  e grid 2×2 de `ActionCard`
- [x] Badges de status (agendamentos, plano, WhatsApp) com `ring-1`

---

## Sprint 4 — Pagamentos (em andamento)

- [x] Setup Stripe (produto + price R$297/mês) — script `npm run stripe:setup`
  cria via API e imprime o `STRIPE_PRICE_ID`
- [x] `lib/stripe.ts` — cliente lazy + `planStatusFromStripe`
- [x] `POST /api/billing/checkout` — customer + sessão de assinatura (trial 7d)
- [x] `POST /api/billing/portal` — portal de gerenciamento Stripe
- [x] `POST /api/webhooks/stripe` (checkout.session.completed,
  customer.subscription.created/updated/deleted, invoice.payment_failed)
- [x] Tela de assinatura (`/configuracoes/assinatura`) — status + assinar/gerenciar
- [x] Bloqueio de IA quando `plan_status = past_due` ou `cancelled` (webhook seta
  `ai_enabled`; o webhook do WhatsApp já filtra por `plan_status`)
- [x] CTA real no `PlanStatusBanner` (`BillingButton` → checkout/portal)
- [x] Testar end-to-end no dev (4242…): checkout → webhook `[200]` →
  `stripe_subscription_id` + `trial_ends_at` gravados, `plan_status='trialing'`
  (correto: assinatura nasce em trial). Falta validar a transição trial→active.
- [ ] Operacional (produção): configurar o endpoint de webhook no painel Stripe
  e setar as envs na Vercel (`STRIPE_*`, `NEXT_PUBLIC_URL` = domínio público)

---

## Sprint 5 — Crescimento (pendente)

- [ ] Landing page pública com conversão (aplicar identidade IAzen)
- [ ] Relatório semanal por email (agendamentos, cancelamentos, no-show)
- [x] Integração com Google Calendar (sync bidirecional)
  - [x] Migration `0002_google_calendar.sql` — colunas `google_*` em
    `professionals`, `google_event_id` em `appointments`, tabela
    `google_busy_events` + RLS **(rodar manualmente no Supabase SQL Editor)**
  - [x] `lib/google/auth.ts` — OAuth dedicado (offline + `calendar.events`),
    refresh token, state assinado, `getAccessToken` com renovação/persistência
  - [x] `lib/google/calendar.ts` — push/delete de eventos, pull incremental
    (syncToken), watch/stopWatch; anti-loop via `extendedProperties.iazenAppointmentId`
  - [x] `lib/google/appointment-sync.ts` — gancho best-effort chamado nos writes
  - [x] Rotas `app/api/google/calendar/{connect,callback,status,sync,disconnect,webhook}`
  - [x] Push ligado em `POST/PATCH /api/appointments`, `/cancel` e `lib/ai/executor.ts`
  - [x] `getAvailableSlots` desconta `google_busy_events` (IA não oferece horário ocupado)
  - [x] `GET /api/appointments` devolve `googleBusy` na janela
  - [x] UI calendário Mês + Semana (`components/agenda/`) + tela `/configuracoes/google`
  - [x] Cron de sync em `vercel.json` (a cada 30 min) como fallback do webhook
  - [ ] **Operacional:** cadastrar o redirect URI
    `${NEXT_PUBLIC_URL}/api/google/calendar/callback` no Google Cloud Console
    (OAuth client) e habilitar a **Google Calendar API** no projeto
  - [x] Testar end-to-end: conectar → criar consulta → conferir evento no Google;
    criar evento pessoal no Google → some da disponibilidade
  - [x] Auto-sync na `/agenda` (ao abrir, ao focar a aba e a cada 60s) — cobre o
    dev sem push; em prod o watch mantém em tempo real
  - [x] Fix: nome do paciente não era salvo pela IA (booking ganhou `patient_name`;
    executor não reescreve mais nome real com "Paciente")
  - [ ] **Pré-lançamento:** publicar o app no Google + passar pela **verificação
    OAuth** (escopo `calendar.events` é sensível). Sem isso: aviso de "app não
    verificado" e, em modo testing, o **refresh token expira em 7 dias** (a
    conexão cai e precisa reconectar)
- [ ] Programa de indicação
- [ ] Métricas de produto (conversão trial → paid, churn)

---

## Sprint 6 — Gestão do consultório (pendente)

> Análise de produto (2026-06-08): o IAzen sabe **marcar** consulta, mas
> "agendar é metade da dor" do profissional autônomo. Este sprint fecha o que
> falta pra virar **gestão do consultório** e segurar o profissional. Itens em
> ordem de alavancagem (retorno ÷ esforço).

### 🔴 Crítico — table stakes / confiança (pré-lançamento)

- [x] **Confirmação via WhatsApp fecha o ciclo** (loop do lembrete está aberto)
  - [x] Adicionar ação `confirm` em `AIAction` (`types/database.ts`)
  - [x] Tratar `confirm` no `lib/ai/executor.ts` → `status=confirmed` na próxima
    consulta `scheduled` do paciente (defesa por `professional_id`)
  - [x] `findUpcomingAppointment` resolve confirm/cancel/reschedule **pelo
    telefone** (a IA não conhece o uuid) — conserta também cancel/remarcar
  - [x] Prompt: paciente "sim/confirmo" → `confirm`; "não vou poder" → `cancel`;
    `appointment_id` deixou de ser exigido (few-shot incluído)
  - [x] Chat de teste mostra a ação `confirm` (`ACTION_LABEL`)
- [x] **Declaração de comparecimento** (documento imprimível / PDF via navegador)
  - [x] Página `/documentos/declaracao/[id]` (server, fora do grupo dashboard)
    + `PrintButton`; botão "Declaração" no form da `/agenda`
  - [ ] Enviar a declaração direto pelo WhatsApp (depende de envio de mídia)
- [ ] **Recibo de pagamento** (depende do valor da consulta → módulo financeiro)
  - [ ] Recibo por consulta (dados do profissional + paciente + valor)
- [x] **Consultas recorrentes** (mesmo horário toda semana — caso do psicólogo)
  - [x] Migration `0003_recurrences.sql` (tabela `recurrences` + `appointments.recurrence_id`)
    **(rodar manualmente no Supabase SQL Editor)**
  - [x] `lib/recurrences/service.ts` — materializa ocorrências (8 semanas à
    frente, idempotente, respeita conflito) e `stopRecurrence`
  - [x] Rotas `POST /api/recurrences`, `POST /api/recurrences/[id]/stop`,
    cron `GET|POST /api/recurrences/materialize` (diário em `vercel.json`)
  - [x] Editar/cancelar "esta" (endpoints atuais) vs "todas as futuras" (Encerrar série)
  - [x] Sincroniza com o Google (cada ocorrência é appointment real → push automático)
  - [x] UI: campo "Repetir" + "até" no form; marcador 🔁; "Encerrar série"
- [ ] **LGPD** (dado sensível de saúde + pré-requisito da verificação OAuth Google)
  - [ ] Consentimento do paciente para receber mensagens (opt-in/opt-out)
  - [ ] Política de privacidade publicada (também exigida pela verificação Google)
  - [ ] Exportar e excluir dados do paciente
- [ ] **Pausar a IA / assumir a conversa** (human handoff por contato)
  - [ ] Flag de "IA pausada" por `patient_phone` (não só o `ai_enabled` global)
  - [ ] Botão na conversa para o profissional assumir/retomar

### 🟡 Alto impacto — vira "gestão" e justifica o preço

- [ ] **Financeiro do paciente** (cobrar o paciente — não confundir com o Stripe da assinatura)
  - [ ] Link de pagamento / PIX por consulta
  - [ ] Marcar pago/pendente; faturamento do mês; inadimplência
- [x] **Tipos de serviço** com duração e preço próprios + intervalo (buffer)
  - [x] Migration `0004_services.sql` (tabela `services` + `appointments.service_id`
    + `professionals.buffer_min`) **(rodar no Supabase SQL Editor)**
  - [x] CRUD `GET|POST /api/services`, `PATCH|DELETE /api/services/[id]`,
    `GET|PATCH /api/professionals` (buffer)
  - [x] Tela `/configuracoes/servicos` (CRUD + intervalo entre atendimentos)
  - [x] Seletor "Serviço" na `/agenda` → fim calculado pela duração; `service_id`
    gravado no appointment
  - [x] `getAvailableSlots` aplica o buffer (expande os compromissos)
  - [ ] Levar serviço/duração para as consultas recorrentes e para a IA (futuro)
- [ ] **Métricas pro profissional** (relatório semanal — ocupação, no-show, novos × retornos, faturamento)
- [ ] **Reativação de pacientes inativos** (mensagem automática de retorno via IA)

### 🟢 Vai fazer falta logo depois

- [ ] **Áudio do WhatsApp** — transcrever notas de voz (webhook hoje só lê texto)
- [ ] **Fila de espera / encaixe** — oferecer horário liberado por cancelamento
- [ ] **Teleconsulta** — link automático na consulta (fisio/nutri online)
- [ ] **Importar pacientes** (CSV / Google Contatos) — reduz atrito do onboarding
- [ ] **Prontuário / evolução por sessão** (hoje só `patient.notes` livre)

### ⚠️ Riscos a mitigar

- [ ] **Ban do número (Evolution não-oficial)** — monitorar conexão e alertar
  ativamente + fluxo de reconectar visível (não perder agendamentos calado)
- [ ] **Custo de IA** com áudio/imagem — medir antes de prometer "ilimitado"

---

## Backlog lateral (não priorizado)

### Integração Z-API (migração Evolution → Z-API)

- [x] Adicionar coluna `zapi_token` na tabela professionals
  - [ ] Migration SQL: `alter table professionals add column zapi_token text;`
    **(rodar manualmente no Supabase SQL Editor)**
  - [x] Atualizar interface `Professional` em [types/database.ts](types/database.ts)
  - [x] Atualizar [CLAUDE.md](CLAUDE.md) com o novo campo
- [x] Reescrever [lib/zapi/client.ts](lib/zapi/client.ts) para Z-API
  - [x] `getQRCode(instanceId, token)` → `GET /qr-code/image` (retorna base64)
  - [x] `getConnectionStatus(instanceId, token)` → `GET /status`
  - [x] `sendWhatsAppMessage(instanceId, token, phone, text)` → `POST /send-text`
  - [x] `disconnectInstance(instanceId, token)` → `POST /disconnect`
  - [x] Removidos `createInstance`, `deleteInstance` e
    `EvolutionInstanceNotFoundError`
- [x] Atualizar [app/api/whatsapp/connect/route.ts](app/api/whatsapp/connect/route.ts)
  - [x] Removida criação de instância
  - [x] Busca `zapi_instance_id` e `zapi_token` do banco
  - [x] Chama `getQRCode` e retorna base64
  - [x] Se não tiver `zapi_instance_id` → `400` orientando contato com suporte
- [x] Atualizar [app/api/whatsapp/webhook/route.ts](app/api/whatsapp/webhook/route.ts)
  - [x] Valida header `client-token` contra `process.env.ZAPI_CLIENT_TOKEN`
  - [x] Lê `instanceId` de `?instance=…` na URL
  - [x] Parsing do payload Z-API: `body.phone` → phone, `body.text.message`
    → message, ignora `fromMe`/`isGroup`
  - [x] Fluxo da IA mantido; também exige `zapi_token` no banco para enviar
    resposta
  - [x] Removido dispatch de `qrcode.updated` / `connection.update`
- [x] Atualizar [app/api/whatsapp/status/route.ts](app/api/whatsapp/status/route.ts)
  - [x] Chama `getConnectionStatus` com credenciais do banco
  - [x] Retorna `{ provisioned, connected, qrcode }`
  - [x] Sincroniza `whatsapp_connected` no banco a cada chamada
- [x] Atualizar [/configuracoes/whatsapp](app/(dashboard)/configuracoes/whatsapp/page.tsx)
  - [x] Estado `not_provisioned` quando `zapi_instance_id` é null (orienta
    suporte)
  - [x] Mostra QR via polling `GET /api/whatsapp/status`
  - [x] Polling a cada 3s enquanto `waiting_scan`
  - [x] Estado `connected` com botão desconectar
- [x] Ajustar [dispatch de lembretes](app/api/reminders/dispatch/route.ts)
  para passar `zapi_token` no `sendWhatsAppMessage`
- [x] Atualizar `.env.example` e `.env.local`: remover `EVOLUTION_API_URL`,
  `EVOLUTION_API_KEY`, `WEBHOOK_SECRET`; adicionar `ZAPI_CLIENT_TOKEN`
### Migração Z-API → Evolution API (self-service por API)

> Motivo: a Z-API não tinha API para criar instâncias (provisionamento manual
> por número). A Evolution expõe `POST /instance/create` → onboarding
> self-service. Colunas `zapi_*` reaproveitadas (instanceName / apikey).

- [x] Reescrever [lib/zapi/client.ts](lib/zapi/client.ts) para Evolution
  - [x] `createInstance(instanceName)` → `POST /instance/create` (qrcode +
    webhook), devolve `{ instanceName, apiKey, qrcode }`
  - [x] `getQRCode` → `GET /instance/connect/{name}` (busca QR confiável)
  - [x] `getConnectionStatus` → `GET /instance/connectionState/{name}`
    (`state === 'open'`)
  - [x] `sendWhatsAppMessage` → `POST /message/sendText/{name}` (`{ number, text }`)
  - [x] `disconnectInstance` → logout + delete
  - [x] Propaga corpo de erro cru do Evolution (debug do QR em branco)
- [x] `connect`: cria instância self-service se não existir e devolve QR
- [x] `status`: provisioned = tem instância; token pode ser null (usa key global)
- [x] `disconnect`: logout + delete + zera `zapi_instance_id`/`zapi_token`
- [x] `webhook`: auth por `?secret=`, parsing `messages.upsert`
  (`remoteJid`/`conversation`), ignora grupo e `fromMe`
- [x] `/configuracoes/whatsapp`: estado `not_provisioned` vira botão "Conectar"
- [x] Dispatch de lembretes não exige mais `zapi_token`
- [x] `.env.local`: remover `ZAPI_CLIENT_TOKEN`; adicionar `EVOLUTION_API_URL`,
  `EVOLUTION_API_KEY`, `WEBHOOK_SECRET`
- [x] Atualizar [CLAUDE.md](CLAUDE.md) e READMEs (lib/zapi + app/api/whatsapp)
- [x] Stack Docker da Evolution em `infra/evolution/` (compose + Postgres + Redis)
- [x] Fix do QR em branco: fixar `CONFIG_SESSION_PHONE_VERSION` (versão do WhatsApp Web)
- [x] Fix do LID (`@lid`): webhook responde no JID completo + imagem
  `evoapicloud/evolution-api:v2.3.7` (a `atendai` parou no 2.2.3 c/ LID quebrado;
  a 2.4.x exige licença). `senderIdentifier()` no webhook trata `@lid` x `@s.whatsapp.net`
- [x] **Testar end-to-end local: conectar (criar instância + QR), mensagem de
  número externo, resposta da IA entregue e persistência** ✅
- [ ] Produção: hospedar servidor Evolution (Railway/VPS) e setar
  `EVOLUTION_API_URL`/`EVOLUTION_API_KEY`/`WEBHOOK_SECRET` na Vercel
- [ ] Em produção, `NEXT_PUBLIC_URL` = domínio público (não `host.docker.internal`)

### Cadastro rico de paciente

- [x] Adicionar campo **CPF** no cadastro de pacientes
  - [x] Migration SQL: `alter table patients add column cpf text;`
    (em `supabase/migrations/0001_patients_cpf.sql` + `schema.sql`)
  - [x] Índice único parcial: `create unique index patients_professional_cpf_idx
    on patients(professional_id, cpf) where cpf is not null;`
  - [x] Atualizar `Patient` em [types/database.ts](types/database.ts)
  - [x] Validação server-side nos endpoints (`POST/PATCH /api/patients` e
    `POST /api/appointments`): 11 dígitos + checksum opcional
    (em [lib/patients/cpf.ts](lib/patients/cpf.ts))
  - [x] Input com máscara `000.000.000-00` em
    [/pacientes](app/(dashboard)/pacientes/page.tsx) e no form de
    [/agenda](app/(dashboard)/agenda/page.tsx)
  - [x] Exibir CPF na lista de pacientes e no autocomplete
  - [x] Atualizar o schema completo em [CLAUDE.md](CLAUDE.md)

### Histórico do paciente

- [x] Página `/pacientes/[id]` com detalhe + lista de appointments
  - [x] Server component consulta appointments direto via Supabase (sem
    endpoint intermediário — `GET /api/patients/[id]/appointments` fica
    pendente até aparecer um consumidor client-side real)
  - [x] UI: cards separados "Próximas consultas" / "Histórico" / "Notas
    clínicas" (abas ficariam para quando o shadcn `tabs` for instalado)
  - [x] Botão "Histórico" em cada linha da lista de pacientes

### Outros

- [ ] Migração futura de WhatsApp para API oficial Meta (`WHATSAPP_PROVIDER=meta`)
  — tudo isolado em `lib/zapi/client.ts`, planejar quando atingir 100+ clientes
- [ ] Dark mode no dashboard
- [ ] App mobile (PWA)
- [ ] Multi-profissional (consultórios com 2+ profissionais)
- [ ] Teleconsulta com link automático
