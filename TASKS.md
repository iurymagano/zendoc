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
- [x] Deploy na Vercel (primeiro deploy de validação)
  - [x] Produção beta em https://iazen.vercel.app (projeto `zendoc`, scope
    iurymaganos-projects, publicado pela CLI a partir da branch do PR #1)
  - [ ] Ligar o repositório do GitHub ao projeto da Vercel depois do merge do
    PR #1 (antes disso, push na main falharia pelos crons de 15/30 min)

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
- [x] Configurar `CRON_SECRET` em produção (Vercel env vars)
- [x] Crons frequentes fora do `vercel.json` (plano grátis da Vercel só aceita
  diário): lembretes a cada 1 min e sync do Google a cada 10 min pelo cron-job.org
- [x] Dispatch reserva o lembrete antes de enviar (sem envio em dobro com cron de 1 min)
- [x] **Operacional:** criar os jobs no cron-job.org com o header `Authorization: Bearer`
- [x] Bug: série recorrente com 1ª data já passada não aparecia na agenda (a 1ª data agora é criada; lembrete de atendimento que já começou é cancelado; aviso na tela com quantos foram marcados)

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
- [x] Correções da homologação em produção
  - [x] Login com Google: a sessão guardava o id aleatório do NextAuth em vez do
    id do Supabase Auth, e o onboarding falhava com FK em `professionals.user_id`
    (`auth.ts` agora resolve o id pelo e-mail, inclusive em sessões antigas)
  - [x] Paciente duplicado: telefone normalizado para 55 + DDD + número em todas
    as rotas que gravam `patients.phone`/`appointments.patient_phone`
    (helper [lib/phone.ts](lib/phone.ts), com testes via `npm test`)
  - [x] `/configuracoes/whatsapp`: botão "Cancelar" no estado "Aguardando scan"
    (remove a instância pendurada na Evolution via `POST /api/whatsapp/disconnect`)
  - [x] Saudação do dashboard pula título (Dr./Dra./Prof.) — "Olá, Teste"
  - [x] Barra de progresso do onboarding em cor sólida `#4F6EF7` (sem gradiente)
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

### Redesign da marca (identidade v1)

- [x] Referências pesquisadas e [DESIGN.md](DESIGN.md) com paleta, tipos, componentes e regras por tela
- [x] Logo em SVG (`Logo`, `LogoMark`, `public/logo*.svg`, `app/icon.svg`)
- [x] Tokens, fontes (Sora, Inter, JetBrains Mono) e componentes `ui/*` base
- [x] Landing nova ("Você atende. Ela agenda.")
- [x] Landing e auth com texto aberto a qualquer profissional ("clientes", "atendimentos") e seção do Assistente pessoal
- [x] Login e cadastro com o lado de marca
- [x] `CLAUDE.md` e READMEs atualizados
- [x] `app/apple-icon` (ícone iOS)
- [x] Fase 2: dashboard (Sidebar, PageHeader, cards de métrica, tabelas, agenda, estados vazios)
- [x] Fase 2: onboarding (tirar o halo radial) e `app/privacidade`
- [x] Fase 2: `/assistente` com a cara da marca (painel Void, faísca como "pensando")
- [x] Landing reconstruída no padrão escuro com degradê, animejs e FAQ (`iris/landing-nova`)
- [x] Página inicial `/dashboard` nova: dia, régua, próximos, atenção, semana, vagas, conversas e checklist de configuração (`lib/dashboard/`, `components/dashboard/home/`)
- [ ] Trocar as conversas de exemplo da landing por conversas reais autorizadas

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

## Sprint 3.6 — Público amplo + Assistente pessoal (em andamento)

> Pedido do Iury (14/11/2026): abrir o IAzen para qualquer pessoa que atende
> com hora marcada (não só saúde) e ter um chat com a própria IA para cuidar da
> agenda e dos lembretes de quem usa. Tabelas e colunas **não** foram
> renomeadas (`patients`, `appointments`...): só o texto visível mudou.

### Público amplo (cliente / atendimento)

- [x] Texto visível em linguagem genérica: "cliente(s)" e "atendimento" no lugar
  de "paciente" e "consulta"; nunca "consultório" (dashboard, agenda, conversas,
  configurações, documentos, mensagens de erro das APIs, READMEs)
- [x] Página `/pacientes` virou `/clientes` (pasta
  `app/(dashboard)/clientes/`); `next.config.ts` redireciona `/pacientes` e
  `/pacientes/:id` → `/clientes` (rota de API `/api/patients` mantida)
- [x] Prompt da secretária do WhatsApp genérico, adaptado à `specialty` do
  profissional (`lib/ai/prompt-builder.ts` + 4 testes)
- [x] Onboarding: lista ampla de áreas de atuação (21 opções) + "Outra" com
  campo livre (até 60 caracteres); `POST /api/onboarding/profile` aceita texto
  livre em `specialty`
- [x] Declaração de comparecimento e política de privacidade sem vocabulário de
  saúde; privacidade passa a citar o Assistente pessoal e os lembretes pessoais
- [x] Eventos do Google Agenda de compromissos pessoais (sem cliente) usam o
  título em vez de "paciente — consulta"
- [ ] Renomear `patients`/`patient_*` no banco e nas rotas `/api/patients`
  (decisão adiada: só vale a pena se o custo de manter o nome antigo atrapalhar)

### Assistente pessoal (chat com a IA da própria agenda)

- [x] Migration `supabase/migrations/0008_assistente_pessoal.sql` (tabelas
  `personal_reminders` e `assistant_messages`, índices, RLS) — **aplicada no
  Supabase de produção** e espelhada em `supabase/schema.sql`
- [x] Tipos `PersonalReminder`, `AssistantMessage` em `types/database.ts`
- [x] `lib/assistant/` — loop de tool use (Claude, limite de 8 iterações), 10
  ferramentas com validação de entrada (zod), executor sempre filtrando pelo
  `professional_id` da sessão, prompt em dois blocos (estável cacheado + data/hora
  atual em America/Sao_Paulo) e 5 suítes de teste
  - [x] Agenda: listar, ver horários livres, criar atendimento, criar compromisso
    pessoal, cancelar e remarcar (com `confirmed`), marcar dia de folga
  - [x] Lembretes: criar, listar e cancelar
  - [x] Cancelar/remarcar só com confirmação explícita no chat; o cliente **não**
    é avisado automaticamente (a resposta lembra disso)
  - [x] Compromisso pessoal = `appointments` manual com `patient_phone` vazio
    (sem lembrete para cliente; aparece na agenda e no Google Agenda)
- [x] `POST /api/assistant/chat` (auth + bloqueio 402 fora de
  `trialing`/`active`), `GET /api/assistant/messages`,
  `GET /api/assistant/reminders`, `POST /api/assistant/reminders/[id]/cancel`
- [x] Página `/assistente` (chat em shadcn + lembretes próximos com cancelar +
  recentes), item "Assistente" na Sidebar, rota protegida em `proxy.ts`
- [x] Cron de lembretes (`/api/reminders/dispatch`) também envia os lembretes
  pessoais vencidos, por WhatsApp, para o telefone do próprio profissional; sem
  plano ativo / WhatsApp / telefone válido o lembrete vira `failed` com o motivo
- [x] Teste real do chat com conta de QA (criar atendimento, consultar agenda,
  lembrete a ~2 min, cancelar com confirmação)
- [ ] Testar o **envio real** do lembrete pessoal por WhatsApp (a conta de QA
  não tem instância conectada; só o caminho "falhou com motivo" foi exercitado)
- [ ] Conferir a página `/assistente` com print (layout desktop e celular)
- [ ] Testar o bloqueio 402 do chat com plano `past_due`/`cancelled`
- [x] Endurecer a confirmação de cancelar/remarcar: hoje é só prompt + flag
  `confirmed` na ferramenta (guarda "macia"); considerar um token de
  confirmação emitido pelo servidor
  - [x] Feito: `prepare_cancel_appointment`/`prepare_reschedule_appointment`
    gravam a ação em `assistant_pending_actions` (migration `0009`, **aplicada
    em produção**, aditiva) e `confirm_pending_action` só a executa numa
    requisição **posterior** (outra mensagem do usuário), em até 15 min, uma vez
    (reserva `pending → done` antes de executar) e revalidando conflito/horário;
    não existe mais ferramenta que cancele/remarque direto (`lib/assistant/pending.ts`
    + `pending.test.ts`; smoke com a conta de QA: confirmar na mesma requisição é
    recusado)
  - [ ] Cobrir `prepare`/`confirm` do executor com teste automatizado (hoje só
    as regras puras de `pending.ts` têm teste; o fluxo com banco foi smoke manual)
  - [x] Achado do qa (PR #2, alta): ao responder "Sim, confirmo" a IA preparava
    de novo e a ação nunca executava (6 de 6 tentativas). Corrigido por dois
    lados: o chat injeta a ação pendente no prompt dinâmico (a IA vai direto ao
    `confirm_pending_action`) **e** repetir o mesmo `prepare_*` não substitui a
    ação pendente (mantém o `request_id`, `decidePendingSave`). Reproduzido com a
    conta de QA e o modelo real: cancelar e remarcar terminam em `done` no banco
    e o atendimento muda
  - [x] Se a execução falha (conflito, horário que passou, erro/exceção), a ação
    volta a `pending` em vez de ficar `done` sem ter sido feita
  - [x] `ilike` do nome de cliente escapa `%`, `_` e `\` (`lib/assistant/ilike.ts`
    + teste)
- [x] Limite de uso do chat: 30 mensagens/10 min e 200/dia por profissional
  (`POST /api/assistant/chat` → 429 com mensagem amigável e `Retry-After`;
  `lib/assistant/rate-limit.ts` + teste; a tela já mostra o `error` retornado)
  - [ ] Hoje conta só turnos concluídos (a linha do usuário é gravada no fim) e
    requisições paralelas passam juntas; se virar problema, gravar a linha antes
    de chamar o modelo ou usar contador atômico
- [x] Declaração de comparecimento (`/documentos/declaracao/[id]`) só é emitida
  se o atendimento já começou e não está cancelado/falta; futuro mostra "A
  declaração fica disponível depois do atendimento"
  (`lib/appointments/declaration.ts` + teste)
  - [ ] Esconder o botão "Declaração" na `/agenda` para atendimento futuro (hoje
    só some para cancelado; a página já bloqueia, mas o botão leva a um aviso)
- [x] `supabase/migrations/README.md` com uma linha por migration (0001–0009)
- [ ] `app/api/patients/route.ts` monta o filtro `.or()` da busca com o texto
  cru: `%`, `_`, `,` e `)` do usuário alteram/quebram o filtro (só afeta a busca
  do próprio profissional); escapar
- [ ] Avisar o cliente (opcional, pedindo OK) quando o atendimento dele for
  cancelado ou remarcado pelo Assistente
  - Nota: **nenhum** fluxo do app avisa o cliente por WhatsApp quando o
    profissional cancela/remarca (nem `POST /api/appointments/:id/cancel`, nem o
    `PATCH`, nem o Assistente) — não há código para reaproveitar; o Assistente
    devolve `client_notified: false` e o prompt manda avisar o profissional disso
  - [ ] Ao remarcar, o lembrete 24h/2h que **já foi enviado** para o horário
    antigo não é reenviado para o novo (só os `pending` são recalculados)
- [x] Editar um compromisso pessoal pela agenda: o formulário valida telefone e
  falharia (cancelar funciona)
  - Feito: `PATCH /api/appointments/[id]` aceita telefone vazio em compromisso
    pessoal (`lib/appointments/personal.ts`), a página da agenda esconde
    telefone/CPF nesse caso e o cron nunca envia para telefone vazio
- [ ] Resumo diário/semanal da agenda enviado pelo Assistente por WhatsApp
- [ ] Recebimento de pedidos pelo WhatsApp do próprio profissional (hoje o chat
  é só na página `/assistente`)

### Bugs encontrados no caminho (fora do escopo, a corrigir)

- [x] `lib/availability/slots.ts` usa o fuso do servidor: em produção (UTC) a
  comparação de conflito/horário ocupado desloca 3 h — padronizar em
  America/Sao_Paulo (-03:00)
  - Feito: cálculo puro em `lib/availability/compute.ts` (testes com `TZ=UTC`,
    Tóquio e Los Angeles); `prompt-builder`, `processor`, `listFreeSlots` do
    Assistente e eventos de dia inteiro do Google também no relógio de São Paulo
- [x] `PATCH /api/appointments/[id]` não reagenda os lembretes pendentes quando
  `starts_at` muda (já existe o helper `rescheduleAppointmentReminders` em
  `lib/appointments/reminders.ts`, usado pelo Assistente)
- [x] `GET /api/professionals` devolve `ai_enabled` (achado do designer)
  - [ ] Nenhuma tela consome `ai_enabled` ainda (Sidebar/serviços): decidir onde
    mostrar o indicador "secretária pausada"

### Máscaras e endereço por CEP

- [x] Máscaras nos campos (`lib/masks.ts` + `components/ui/masked-input.tsx`):
  telefone `(11) 99999-9999` (onboarding, `/clientes`, `/agenda`), CPF, valor em
  R$ (preço do serviço); valores do banco já aparecem formatados
- [x] Telefone formatado também nas listas (conversas, sugestões de cliente da agenda)
- [x] Endereço de atendimento por CEP (ViaCEP): CEP com máscara, preenche rua,
  bairro, cidade/UF; número e complemento manuais; salvo como texto único em
  `professionals.address` (`lib/address.ts`, `components/onboarding/AddressFields.tsx`)
- [x] Botão "Replicar" por dia em `/configuracoes/disponibilidade` (copiar a rotina de um dia
  para outros; atalhos úteis/fim de semana/todos; só persiste no Salvar)
### Notificações no app (sino do painel)

- [x] Migration `0010_notifications.sql` + `supabase/schema.sql` (tabela `notifications`, RLS, dedupe)
  - [x] Aplicar `0010` no Supabase de produção (SQL Editor) — aplicada em 14/11/2026; sem a tabela os avisos só geram `console.error`
- [x] `lib/notifications/`: `createNotification` (nunca derruba o fluxo), builders puros testados, dedupe, datas em São Paulo
- [x] Cancelou/remarcou em todos os caminhos, com quem fez: cliente via IA, profissional (agenda), Assistente, série recorrente encerrada
- [x] IA agendou pelo WhatsApp / pedido aguardando aprovação / cliente confirmou presença
- [x] Conversa que precisa do dono (handoff, aprovação, IA perdida 2x seguidas, IA pausada)
- [x] WhatsApp desconectado (`connection.update` da Evolution, com confirmação antes de avisar)
- [x] Falhas: lembrete ao cliente que não saiu, resposta da IA que não foi enviada
- [x] Conflito com evento do Google Agenda (detectado no sync; o sync nunca cancela nem move nada)
- [x] API: `GET /api/notifications` (`?since=`), `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`
- [x] UI: sino no painel (popover no desktop, sheet no celular), selo, lista, "marcar todas", estado vazio, toast nas novas, polling 20 s
- [x] Link de cada aviso abre o assunto (agenda no dia / conversa do contato / tela do WhatsApp)
- [x] Testar no navegador com a tabela aplicada (gerar eventos reais, prints 1440 px e iPhone)
- [ ] Sugestão: aviso "atendimento daqui a 2 h" para o dono (precisa de cron próprio, não há gatilho hoje)
- [ ] Sugestão: aviso de "não compareceu" (hoje o dono marca à mão; sem gatilho automático)
- [ ] Sugestão: aviso quando a agenda do Google muda/cancela um atendimento do IAzen (hoje o sync só lê eventos de fora)
- [ ] Sugestão: aviso de lembrete pessoal que falhou (hoje só aparece o `failed` no histórico do Assistente)
- [ ] Sugestão: limpeza de notificações antigas (retenção, ex.: 90 dias) e usar `?since=` no polling
- [ ] Sugestão: preferências por tipo de aviso (silenciar tipos)

### Redesign premium do painel

> Pedido do Iury (14/11/2026). Decisões em [DESIGN.md](DESIGN.md), seção "Painel: redesign premium".

- [x] Etapa 1 — Fundação: tokens (status, movimento, raios, sombra), `components/appointments/status.ts`,
  `PageContainer`, `PageHeader` sem eyebrow, `SectionHeader`, `MetricCard`, `StatusBadge`,
  `AppointmentCard`, `LoadingSkeleton`, `SearchInput`, `FilterBar`, shadcn `dialog`/`tabs`/`dropdown-menu`/`tooltip`/`badge`/`table`
- [x] Etapa 2 — Início (`/dashboard`): trocar `SectionLabel`/`Panel` por `SectionHeader`/`MetricCard`, raio 16, limpar `eyebrow` das páginas
- [x] Etapa 3 — Agenda: calendário, linha de "agora" (violeta, faísca só no ponto), formulário em `Dialog`
- [ ] Etapa 4 — Listas (clientes, conversas) com `FilterBar`, `SearchInput` e `LoadingSkeleton`
- [ ] Etapa 5 — Configurações e assistente: `Tabs`, `Table`, estados vazios e revisão final em 390/768/1440

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
- [x] Operacional (produção): configurar o endpoint de webhook no painel Stripe
  e setar as envs na Vercel (`STRIPE_*`, `NEXT_PUBLIC_URL` = domínio público)
  (feito em modo de teste: endpoint `/api/webhooks/stripe` em iazen.vercel.app)
- [ ] Trocar o Stripe para as chaves live (e novo webhook) quando o beta virar
  venda paga

---

## Sprint 5 — Crescimento (pendente)

### Painel admin do dono (`/admin`)

> Pedido do Iury (17/11/2026): uma página só para ele ver acessos, usuários, pagantes e uso.

- [x] `lib/admin/types.ts` — contrato `AdminOverview` entre dados e tela
- [x] `lib/admin/access.ts` — `isAdminEmail` (env `ADMIN_EMAILS`) + `requireAdmin()` (404 para quem não é admin) + teste
- [x] Migration `0011_admin_metrics.sql` (`activity_days`, `site_visits`, `touch_activity`, `increment_site_visit`, RLS sem policy) + `schema.sql` + README (aplicada em produção em 17/11/2026, aditiva)
- [x] Rastreio de uso do painel: `touchActivity` em `app/(dashboard)/layout.tsx` via `after()`
- [x] Contador de visitas públicas: `POST /api/track/visit` + `components/landing/VisitBeacon.tsx` (`/`, `/register`, `/login`, `/privacidade`)
- [x] `lib/admin/compute.ts` (puro, testado) + `lib/admin/metrics.ts` (`getAdminOverview`)
- [x] `proxy.ts` exige login em `/admin`; `ADMIN_EMAILS` documentada no `CLAUDE.md` e no README raiz
- [x] `/privacidade` menciona os registros de acesso e uso
- [ ] Setar `ADMIN_EMAILS` na Vercel (produção) para o `/admin` abrir lá
- [ ] Tela `/admin` (`app/admin/**`, `components/admin/**`) e link na Sidebar (designer)
- [ ] Sugestões: retenção por coorte, origem do cadastro (UTM), MRR real via Stripe

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
    (movido para o cron-job.org a cada 10 min — plano grátis da Vercel)
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
- [x] **LGPD** (dado sensível de saúde + pré-requisito da verificação OAuth Google)
  - [x] Política de privacidade pública `/privacidade`; link no footer da landing
  - [x] Tirar da página pública os campos provisórios e o aviso interno; dados legais
    vêm das envs `PRIVACY_*` (sem elas, a linha some) + teste que barra placeholder
  - [ ] Preencher `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTROLLER_DOC` e
    `PRIVACY_CONTACT_EMAIL` na Vercel (dados do Iury) e revisar o texto com advogado
  - [x] Opt-out de mensagens ativas por paciente (`patients.messaging_opted_out`,
    migration `0007`): toggle no cadastro, badge na lista; o dispatch de lembretes
    pula quem optou por não receber (conversas iniciadas pelo paciente seguem)
  - [x] Exportar dados do paciente (`GET /api/patients/[id]/export` → JSON com
    cadastro + agendamentos + conversa); excluir já existia (`DELETE`)
  - [ ] **Operacional:** preencher a política com dados legais reais + revisão
    jurídica antes do lançamento; apontar a URL na tela de consentimento do Google
- [x] **Pausar a IA / assumir a conversa** (human handoff por contato)
  - [x] Migration `0005_conversation_state.sql` (flag `ai_paused` por
    `professional_id + patient_phone`) **(rodar no Supabase SQL Editor)**
  - [x] `lib/conversations/state.ts` (`isConversationPaused`/`setConversationPaused`)
  - [x] Webhook do WhatsApp: se pausado, guarda a mensagem e não aciona a IA
  - [x] Caixa de conversas `/conversas` (inbox + thread, poll de 10s) +
    `GET|POST /api/conversations[...]` (listar, abrir, pausar, enviar manual)
  - [x] Botão "Assumir conversa"/"Retomar IA" + envio manual pelo WhatsApp
  - [x] Pausa respeitada também no simulador (`/api/ai/test`), não só no webhook
- [x] **Sinalização "precisa de resposta"** (IA com dúvida → notifica o profissional)
  - [x] Migration `0006_conversation_needs_attention.sql` (`needs_attention`)
    **(rodar no Supabase SQL Editor)**
  - [x] Ação `handoff` da IA (escala quando foge do escopo) + fallback → marcam
    `needs_attention` no `processor`; envio manual limpa
  - [x] Inbox: badge vermelho + ordenação por prioridade; aviso na thread;
    contador no header; badge no Navbar (`/api/conversations/attention-count`)
- [x] **Fix de layout** do chat (rolagem interna + auto-scroll, não estica a página)

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
- [x] Produção: hospedar servidor Evolution (Railway/VPS) e setar
  `EVOLUTION_API_URL`/`EVOLUTION_API_KEY`/`WEBHOOK_SECRET` na Vercel
  - [x] Servidor Evolution na VM e2-micro grátis do Google Cloud (Docker +
    Caddy com HTTPS em `130-211-208-101.sslip.io`; ver `infra/evolution/README.md`)
  - [x] Setar as três envs na Vercel
- [x] Em produção, `NEXT_PUBLIC_URL` = domínio público (não `host.docker.internal`)
- [ ] Reservar IP fixo para a VM da Evolution (hoje é efêmero: se a VM for
  recriada o IP muda e `EVOLUTION_API_URL` precisa mudar; conferir o preço antes)
- [ ] Google OAuth está em modo "Testando": adicionar o Gmail de cada beta
  tester como usuário de teste (ou publicar o app, que pede verificação por
  causa do escopo do Google Agenda)

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
    [/pacientes](app/(dashboard)/clientes/page.tsx) e no form de
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
