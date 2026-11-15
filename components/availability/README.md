# components/availability/

Componentes da tela de disponibilidade semanal.

## WeekdayRow.tsx

**O que faz:** client component que renderiza um card por dia da semana com:

- toggle "Atendo este dia"
- três blocos opcionais (manhã, almoço, tarde) com horários `start_time`/`end_time`

**Exporta:**

- `WeekdayRow({ day, onChange, onReplicate? })` — componente; com `onReplicate` mostra o botão "Replicar" ao lado do nome do dia
- `BlockState`, `DayState` — tipos (reexportados de `@/lib/availability/replicate`)

**Depende de:** `@/components/ui/{input,switch,label}`, `./ReplicateDayButton`

**Notas:**

- O bloco `lunch` representa uma **pausa** — no backend tem `block_type='lunch'`
  e é filtrado em `getAvailableSlots` (nunca oferecido aos clientes).
- Quando `day.active === false`, os blocos ficam escondidos mas o state deles é
  preservado no client para o usuário poder reativar sem reconfigurar.
- Layout dos horários: a linha de cada bloco quebra (`flex-wrap`); no celular o rótulo ocupa a linha inteira e os dois campos de hora dividem a largura (`flex-1`), de `sm` em diante o rótulo tem `w-44` e cada campo `w-40`, o suficiente para o formato de 12h ("08:00 AM") sem cortar.

## ReplicateDayButton.tsx

**O que faz:** botão "Replicar" de um dia: abre um popover com os outros dias em
checkboxes, atalhos "Dias úteis", "Fim de semana" e "Todos" e o botão "Aplicar".

**Exporta:**

- `ReplicateDayButton({ sourceWeekday, onApply(targets) })` — componente

**Depende de:** `@/components/ui/{popover,checkbox,button,label}`, `@/lib/availability/replicate`

**Notas:** só escolhe os destinos; a cópia é `replicateDay` e o aviso é feito pela tela.
O dia de origem não aparece na lista. "Aplicar" fica desabilitado sem nenhum dia marcado
e o popover reinicia a seleção ao abrir.
