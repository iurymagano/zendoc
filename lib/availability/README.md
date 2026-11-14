# lib/availability/

Cálculo de slots disponíveis a partir da rotina semanal + exceções, descontando
agendamentos existentes.

## compute.ts

**O que faz:** cálculo **puro** dos slots (sem banco/rede), sempre no relógio de
`America/Sao_Paulo` (offset fixo `-03:00`), **independente do fuso do servidor**
(a Vercel roda em UTC; um bloco 08:00–12:00 antes gerava 05:00 no servidor).

**Exporta:**

- `computeSlots({ now, days, weekly, exceptions, busy, bufferMin? }): Slot[]` —
  `busy` junta atendimentos ativos + eventos ocupados do Google; devolve os
  `Slot` (`start`/`end` como instantes) em ordem. Datas/horas usam
  `lib/assistant/datetime.ts` (nada de `getHours()` local).
- `type Slot = { start: Date; end: Date }`

**Notas:** coberto por `compute.test.ts`, que roda com vários `TZ` (UTC,
America/Sao_Paulo, Asia/Tokyo, America/Los_Angeles) e confere que o bloco
08:00–12:00 gera `08:00-03:00` e que existe conflito com um agendamento.

---

## slots.ts

**O que faz:** calcula os horários livres para agendamento a partir de hoje +
`days` dias (default 14), usado pelo prompt da IA e pelas telas de agenda.
Faz só as consultas ao banco e delega o cálculo a `compute.ts`.

**Exporta:**

- `type Slot = { start: Date; end: Date }` (reexportado por `slots.ts`)
- `getAvailableSlots(professionalId: string, days = 14): Promise<Slot[]>` —
  lista de `Slot` (início + fim) em ordem cronológica. O fim vem do
  `slot_duration` do bloco; o prompt da IA usa os dois ISOs para o agendamento
  copiar verbatim (evita a IA chutar ano/horário).

**Depende de:** `@/lib/supabase`, `@/types/database`, `./compute`.

**Regras críticas:**

- `block_type = 'lunch'` é filtrado na query — nunca é oferecido como slot.
- Exceção na data tem prioridade sobre a rotina semanal:
  - `day_off` → pula o dia inteiro.
  - `custom_hours` / `extra_day` → usa o horário da exceção em vez da rotina
    (com fallback de `slot_duration = 50` se a exceção não definir).
- Conflitos com `appointments` em status `scheduled`, `confirmed` ou
  `pending_approval` são descartados.
- Conflitos com `google_busy_events` (compromissos pessoais sincronizados do
  Google Calendar) também são descartados — a IA não oferece horário ocupado na
  agenda pessoal do profissional.
- **Buffer:** cada compromisso é expandido por `professionals.buffer_min`
  (minutos) dos dois lados ao checar conflito — garante o intervalo mínimo entre
  atendimentos nos slots oferecidos pela IA. A criação manual não aplica buffer
  (o profissional pode encaixar como quiser).
- Apenas slots estritamente **no futuro** (`slot > now`) entram no retorno.

**Notas:**

- A janela de 14 dias é configurável pelo parâmetro, mas a query SQL das
  exceções e agendamentos também é limitada por esse range — expandir `days`
  custa uma query do mesmo tamanho.
