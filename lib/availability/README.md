# lib/availability/

Cálculo de slots disponíveis a partir da rotina semanal + exceções, descontando
agendamentos existentes.

## slots.ts

**O que faz:** calcula os horários livres para agendamento a partir de hoje +
`days` dias (default 14), usado pelo prompt da IA e pelas telas de agenda.

**Exporta:**

- `type Slot = { start: Date; end: Date }`
- `getAvailableSlots(professionalId: string, days = 14): Promise<Slot[]>` —
  lista de `Slot` (início + fim) em ordem cronológica. O fim vem do
  `slot_duration` do bloco; o prompt da IA usa os dois ISOs para o agendamento
  copiar verbatim (evita a IA chutar ano/horário).

**Depende de:** `@/lib/supabase`, `@/types/database`, `date-fns`.

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
- Apenas slots estritamente **no futuro** (`slot > now`) entram no retorno.

**Notas:**

- A janela de 14 dias é configurável pelo parâmetro, mas a query SQL das
  exceções e agendamentos também é limitada por esse range — expandir `days`
  custa uma query do mesmo tamanho.
