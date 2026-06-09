# components/agenda/

Componentes do calendário visual da página `/agenda` (vistas Mês e Semana,
estilo Google Calendar). Renderizam appointments e os compromissos pessoais
sincronizados do Google (`google_busy_events`, read-only).

---

## calendar-utils.ts

**O que faz:** helpers e tipos compartilhados pelas duas vistas.

**Exporta:**

- `TZ` — `'America/Sao_Paulo'`
- `BusyEvent` — tipo do evento pessoal do Google vindo de `GET /api/appointments`
- `tzDateKey(iso): string` — chave de dia `yyyy-MM-dd` no fuso do consultório
- `tzMinutes(iso): number` — minutos desde a meia-noite no fuso (posicionamento)
- `formatTime(iso): string` — `HH:mm`
- `STATUS_LABEL` / `STATUS_BLOCK` — rótulo e classes de cor do bloco por status
- `groupByDay(appointments)` / `groupBusyByDay(busy)` — agrupam por dia

**Notas:** as chaves de dia das células são geradas em hora local (date-fns) e
comparadas com `tzDateKey` dos eventos — alinhado para usuários no Brasil.

---

## CalendarMonth.tsx

**O que faz:** grade do mês (6 semanas, segunda a domingo). Cada célula mostra
até 3 agendamentos + indicador de compromisso Google; "+N mais" no excedente.

**Exporta:** `CalendarMonth(props)` — `{ monthCursor, appointments, busy,
onSelectAppointment, onSelectDay }`. Clique no dia → criar; clique no bloco → editar.

**Depende de:** `calendar-utils`, `date-fns`, `types/database`.

---

## CalendarWeek.tsx

**O que faz:** time-grid da semana (7 colunas de dia × linhas de hora). Blocos
posicionados pelo horário; faixa 7h–20h expandida para caber os eventos.
Compromissos do Google aparecem tracejados/cinza (read-only).

**Exporta:** `CalendarWeek(props)` — `{ weekStart, appointments, busy,
onSelectAppointment, onSelectSlot }`. Clique na linha de hora → criar no slot;
clique no bloco → editar.

**Depende de:** `calendar-utils`, `date-fns`, `types/database`.

**Notas:** altura da hora fixa em `HOUR_PX = 48`.
