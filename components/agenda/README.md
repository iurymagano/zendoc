# components/agenda/

Componentes da página `/agenda`: barra de período, grades Dia/Semana e Mês,
formulário e detalhes (Dialog no desktop, Sheet no celular). Renderizam
appointments e os compromissos pessoais sincronizados do Google
(`google_busy_events`, read-only). Cor, ícone e rótulo de status vêm sempre de
`components/appointments/status.ts`.

---

## calendar-utils.ts

**O que faz:** helpers e tipos compartilhados pelas visões.

**Exporta:**

- `TZ` — `'America/Sao_Paulo'`
- `BusyEvent` — tipo do evento pessoal do Google vindo de `GET /api/appointments`
- `tzDateKey(iso): string` — chave de dia `yyyy-MM-dd` no fuso da agenda
- `tzMinutes(iso): number` — minutos desde a meia-noite no fuso (posicionamento)
- `formatTime(iso): string` — `HH:mm`
- `STATUS_LABEL` / `STATUS_DOT` / `STATUS_BLOCK` — derivados de `components/appointments/status.ts`
- `groupByDay(appointments)` / `groupBusyByDay(busy)` — agrupam por dia

**Notas:** `AppointmentCard` (dashboard) importa `formatTime` daqui. As chaves de dia
das células são geradas em hora local (date-fns) e comparadas com `tzDateKey`
dos eventos — alinhado para usuários no Brasil.

---

## agenda-utils.ts

**O que faz:** tipos, constantes e funções puras da página (sem React).

**Exporta:**

- `View` (`'day' | 'week' | 'month'`), `Repeat`, `REPEAT_ITEMS`, `FormState`, `EMPTY_FORM`, `DEFAULT_DURATION_MIN` (50)
- `localToISO(local)` / `isoToLocal(iso)` / `addMinutesToLocal(local, min)` — conversões do `datetime-local` (sempre `-03:00`)
- `rangeFor(view, cursor)` — janela buscada: Dia e Semana usam a semana do cursor (segunda a domingo); Mês usa a grade completa
- `periodLabel(view, cursor)` — texto do período na barra
- `buildAvailability(weekly, exceptions)` — `(dateKey) => intervalos em minutos | null` com a rotina do dia; exceção vence a semanal, `lunch` nunca conta, `day_off` = vazio, sem rotina cadastrada = `null` (nada hachurado)
- `complementRanges(ranges, from, to)` — o que sobra de uma faixa depois de tirar os intervalos (usado para hachurar o "fora da rotina")

---

## time-grid-layout.ts

**O que faz:** `layoutLanes(items, minLength = 25)` distribui blocos que se sobrepõem em faixas lado a lado (`lane`/`lanes`).

---

## useMediaQuery.ts / useNow.ts

**O que fazem:** `useMediaQuery(query, fallback = false)` (via `useSyncExternalStore`, sem flash de hidratação) e `useNow()` (`Date | null`, nulo até montar, atualiza a cada 30s para a linha de agora).

---

## AgendaToolbar.tsx

**O que faz:** barra de período: setas anterior/próximo, "Hoje", título do período (`aria-live`) e abas Dia/Semana/Mês.

**Exporta:** `AgendaToolbar({ view, onViewChange, label, onPrev, onNext, onToday })`

---

## DayStrip.tsx

**O que faz:** faixa de 7 dias (segunda a domingo) para trocar o dia no celular; marca o dia selecionado (`aria-pressed`) e os dias com atendimentos.

**Exporta:** `DayStrip({ cursor, appointments, onSelect(day) })`

---

## CalendarTimeGrid.tsx

**O que faz:** grade de horas compartilhada por **Dia** (1 coluna) e **Semana** (7). Cabeçalho e corpo usam o mesmo `gridTemplateColumns` (sem desalinhar em 390/768), cabeçalho e coluna de horas fixos ao rolar, dia atual destacado, linha de agora (violeta, com ponto Faísca), hover por faixa, horas fora da rotina hachuradas, compromissos do Google tracejados com cadeado e blocos de atendimento em tom suave com barra lateral de 3px, hora em mono, cliente, serviço (se couber) e ícone + texto do status.

**Exporta:** `CalendarTimeGrid({ days, appointments, busy, availability, serviceNames, onSelectAppointment, onSelectSlot })`

**Depende de:** `calendar-utils`, `agenda-utils`, `time-grid-layout`, `useNow`, `components/appointments/status`.

**Notas:** altura da hora `HOUR_PX = 56`; faixa padrão 7h–20h, expandida para caber eventos e rotina; rola sozinha para "agora" (ou o 1º evento) ao trocar o período. Eventos que se sobrepõem ficam lado a lado.

---

## CalendarMonth.tsx

**O que faz:** grade do mês (6 semanas, segunda a domingo). Cada célula mostra até 3 chips (2 abaixo de 640px, onde mostram só o ícone do status) sem estourar a célula; o excedente vira o botão "+N", que abre a visão Dia.

**Exporta:** `CalendarMonth({ monthCursor, appointments, busy, onSelectAppointment, onSelectDay, onOpenDay })` — clique no fundo da célula → criar; número do dia ou "+N" → `onOpenDay`; chip → detalhes.

---

## AgendaLegend.tsx

**O que faz:** legenda dos status (ícone + rótulo de `STATUS`), compromisso do Google e, se houver rotina, "Fora da rotina". **Exporta:** `AgendaLegend({ showRoutine })`.

---

## AgendaSkeleton.tsx

**O que faz:** esqueleto com a forma da agenda (barra opcional + grade), `role="status"`. **Exporta:** `AgendaSkeleton({ toolbar?, className? })`.

---

## ResponsiveOverlay.tsx

**O que faz:** Dialog a partir de 768px, Sheet de baixo (até 92dvh) abaixo disso, com título e descrição acessíveis. **Exporta:** `ResponsiveOverlay({ open, onOpenChange, title, description?, children, className? })`.

---

## AppointmentForm.tsx

**O que faz:** formulário de novo agendamento/edição (mesmas regras e endpoints de antes): autocomplete de cliente (nome ou telefone), telefone e CPF com máscara, serviço (calcula o Fim pela duração), início/fim, repetição (série via `POST /api/recurrences`, com aviso de quantos foram marcados) e anotações; compromisso pessoal sem telefone/CPF; aviso de série ao editar uma ocorrência. No celular, rodapé fixo com as ações.

**Exporta:** `AppointmentForm({ editing, initialStart?, patients, services, onCancel, onSaved })` — `onSaved` é aguardado após o sucesso (a página recarrega os dados e fecha).

**Depende de:** `agenda-utils`, `lib/phone`, `lib/patients/cpf`, `lib/appointments/personal`, `components/ui/*`.

---

## AppointmentDetails.tsx

**O que faz:** detalhes do atendimento (status, série, data, horário, telefone, serviço, origem, anotações, motivo do cancelamento) e as ações conforme o status: pessoal só "Cancelar compromisso"; pendente Aprovar/Rejeitar; agendado Confirmar/Cancelar; confirmado Não compareceu/Cancelar; mais Editar, Declaração (cliente, não cancelado) e Encerrar série.

**Exporta:** `AppointmentHandlers` (`onEdit`, `onSetStatus`, `onCancel`, `onStopSeries`) e `AppointmentDetails({ appointment, serviceName?, handlers })`.
