# app/(dashboard)/agenda/

Calendário visual de agendamentos — vistas **Dia**, **Semana** e **Mês**. Mostra os
appointments do IAzen e os compromissos pessoais sincronizados do Google Calendar
(read-only). Os componentes ficam em `components/agenda/`.

## loading.tsx

**O que faz:** esqueleto da rota enquanto a página carrega (título, botão e
`AgendaSkeleton` com a barra de período e a grade).

**Depende de:** `components/agenda/AgendaSkeleton`, `components/layout/PageContainer`, `components/ui/skeleton`.

## page.tsx

**O que faz:** client component que só orquestra: carrega dados, controla a
navegação/visão e abre os detalhes e o formulário. A tela em si é composta por
`AgendaToolbar`, `DayStrip`, `CalendarTimeGrid`/`CalendarMonth`, `AgendaLegend` e
duas sobreposições (`ResponsiveOverlay`: Dialog no desktop, Sheet no celular).

**Fluxo:**

1. `view` (`'day' | 'week' | 'month'`): no celular (<768px) o padrão é **Dia**
   (com a faixa de 7 dias para trocar o dia); no desktop é **Semana**. A escolha
   manual do usuário vale depois. `cursor` é a data de referência.
   `rangeFor(view, cursor)` define a janela buscada (Dia e Semana: segunda a
   domingo da semana do cursor; Mês: grade completa).
2. `GET /api/appointments?from&to` devolve `{ appointments, googleBusy }`. Só a
   resposta da última busca vale (navegar rápido não mistura períodos). Erro →
   alerta com "Tentar de novo". Depois de uma ação, a recarga é silenciosa
   (sem piscar o esqueleto).
3. Só leitura, para hachurar o que está **fora da rotina**:
   `GET /api/availability/weekly` e `GET /api/availability/exceptions?from&to`
   (`buildAvailability`). Sem rotina cadastrada, nada é hachurado.
4. Estado vazio discreto (uma linha) quando o período não tem atendimentos.

**Link de notificação:** `?date=YYYY-MM-DD` (vindo do sino) leva o calendário
para o dia indicado, mantendo a visão atual (`UrlParamEffect` dentro de
`<Suspense>`; valor malformado é ignorado); o `n=<id>` extra faz o mesmo
clique funcionar de novo com a página já aberta. No Mês, o número do dia e o
"+N" abrem a visão Dia daquela data.

**Atalho de criação:** `/agenda?novo=1` abre o formulário de novo agendamento direto (usado pelo botão do painel); o parâmetro é removido da URL depois de aberto.

**Navegação:** abas Dia/Semana/Mês, setas ← → (passo de 1 dia, 7 dias ou 1 mês
conforme a visão) e botão "Hoje".

**Auto-sync do Google:** ao montar, ao a aba voltar ao foco e a cada 60s, a
página dispara `POST /api/google/calendar/sync` (throttle de 30s) e recarrega os
dados se algo mudou. Cobre o dev, onde não há push do Google (sem https público);
em prod o watch já mantém atualizado. Quando o Google não está conectado, a rota
responde 200 silencioso (`{ connected: false }`) e o auto-sync não faz nada.

**Criação e edição:**

- "Novo agendamento" e o clique numa **faixa de hora** (Dia/Semana) ou num **dia**
  (Mês) abrem o formulário numa sobreposição, já com data/hora pré-preenchida
  (o botão arredonda "agora" para os próximos 15 min).
- Clicar num **bloco** abre os **detalhes** (sobreposição) com as ações de status
  (Aprovar/Rejeitar, Confirmar, Não compareceu, Cancelar conforme o status),
  Editar, Declaração e Encerrar série. Editar abre o formulário em modo edição.
- Regras do formulário (telefone `normalizePhoneBR`, serviço calcula o Fim,
  compromisso pessoal sem cliente, série via `POST /api/recurrences` com o aviso
  de quantos foram marcados) estão em `components/agenda/AppointmentForm.tsx`.

**Cancelamento:** `window.confirm` + `window.prompt` (motivo) →
`POST /api/appointments/:id/cancel`. **Encerrar série:** `window.confirm` →
`POST /api/recurrences/:id/stop`. Mudança de status: `PATCH /api/appointments/:id`.

**Depende de:**

- `@/components/agenda/*` (toolbar, grade, mês, faixa de dias, legenda, esqueleto, formulário, detalhes, overlay, `agenda-utils`, `calendar-utils`)
- `@/components/layout/PageContainer`, `@/components/dashboard/{PageHeader,UrlParamEffect}`, `@/components/ui/button`
- `GET /api/appointments`, `POST/PATCH /api/appointments`, `POST /api/appointments/:id/cancel`, `GET /api/patients`, `GET /api/services`, `GET /api/availability/{weekly,exceptions}`, `POST /api/google/calendar/sync`
- `@/lib/appointments/personal`, `date-fns`

**Notas:**

- Horários em ISO com offset `-03:00`; o `datetime-local` recebe `:00-03:00`.
- Posicionamento/agrupamento dos blocos usa helpers de fuso (`tzDateKey`,
  `tzMinutes`) fixados em `America/Sao_Paulo` (ver `calendar-utils.ts`).
- Os compromissos do Google aparecem read-only (tracejados, com cadeado) e também
  bloqueiam a disponibilidade oferecida pela IA (ver `lib/availability/slots.ts`).
- Cores e rótulos de status vêm só de `components/appointments/status.ts`.
