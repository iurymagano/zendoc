# lib/availability/

Cálculo de slots disponíveis a partir da rotina semanal + exceções, descontando
agendamentos existentes.

## slots.ts

**O que faz:** calcula os horários livres para agendamento a partir de hoje +
`days` dias (default 14), usado pelo prompt da IA e pelas telas de agenda.

**Exporta:**

- `getAvailableSlots(professionalId: string, days = 14): Promise<Date[]>` —
  lista de `Date` em ordem cronológica.

**Depende de:** `@/lib/supabase`, `@/types/database`, `date-fns`.

**Regras críticas:**

- `block_type = 'lunch'` é filtrado na query — nunca é oferecido como slot.
- Exceção na data tem prioridade sobre a rotina semanal:
  - `day_off` → pula o dia inteiro.
  - `custom_hours` / `extra_day` → usa o horário da exceção em vez da rotina
    (com fallback de `slot_duration = 50` se a exceção não definir).
- Conflitos com `appointments` em status `scheduled`, `confirmed` ou
  `pending_approval` são descartados.
- Apenas slots estritamente **no futuro** (`slot > now`) entram no retorno.

**Notas:**

- A janela de 14 dias é configurável pelo parâmetro, mas a query SQL das
  exceções e agendamentos também é limitada por esse range — expandir `days`
  custa uma query do mesmo tamanho.
