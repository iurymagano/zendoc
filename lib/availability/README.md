# lib/availability/

Cálculo de slots disponíveis a partir da rotina semanal + exceções, descontando
agendamentos existentes.

Será implementada na Sprint 2. Arquivos previstos (especificados em `CLAUDE.md`):

- `slots.ts` — `getAvailableSlots(professionalId, days = 14)`

**Regra crítica:** `block_type = 'lunch'` nunca é oferecido, e exceções têm
prioridade sobre a rotina semanal.
