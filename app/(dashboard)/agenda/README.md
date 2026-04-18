# app/(dashboard)/agenda/

Visão semanal de agendamentos — lista cada um dos 7 dias com os appointments
daquela data.

## page.tsx

**O que faz:** client component com navegação de semanas e listagem por dia.

**Fluxo:**

1. `weekStart` começa na segunda-feira da semana atual (`startOfWeek` com
   `weekStartsOn: 1`).
2. Ao mudar `weekStart`, refaz `GET /api/appointments?from&to` para a janela
   de 7 dias daquela semana.
3. Agrupa os appointments por dia via `isSameDay` e renderiza um `Card` por
   dia, destacando o dia de hoje com `border-primary/40` + etiqueta "hoje".
4. Cada item mostra intervalo de horário, nome do paciente, telefone, origem
   (IA/manual), notas e motivo de cancelamento quando houver. Appointments
   `cancelled`/`no_show` ficam com `opacity-60`.

**Navegação:** botões "Semana anterior", "Hoje" e "Próxima semana" ajustam
`weekStart` com `addDays(±7)`.

**Formatação de horas:** via `Intl.DateTimeFormat` fixado em
`America/Sao_Paulo` — seguro independentemente do fuso da runtime.

**Depende de:**

- `@/components/ui/{button,card}`
- `GET /api/appointments`
- `date-fns`, `date-fns/locale`

**Notas:**

- A criação/edição manual de appointments entra na próxima iteração.
- Status badges usam cores do tema (primary/emerald/amber/muted/destructive)
  — quando o shadcn `badge` for instalado, migrar para componente dedicado.
