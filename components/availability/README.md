# components/availability/

Componentes da tela de disponibilidade semanal.

## WeekdayRow.tsx

**O que faz:** client component que renderiza um card por dia da semana com:

- toggle "Atendo este dia"
- três blocos opcionais (manhã, almoço, tarde) com horários `start_time`/`end_time`

**Exporta:**

- `WeekdayRow({ day, onChange })` — componente
- `BlockState` — tipo `{ enabled, start, end }`
- `DayState` — tipo `{ weekday, active, morning, lunch, afternoon }`

**Depende de:** `@/components/ui/{input,switch,label}`

**Notas:**

- O bloco `lunch` representa uma **pausa** — no backend tem `block_type='lunch'`
  e é filtrado em `getAvailableSlots` (nunca oferecido aos pacientes).
- Quando `day.active === false`, os blocos ficam escondidos mas o state deles é
  preservado no client para o usuário poder reativar sem reconfigurar.
