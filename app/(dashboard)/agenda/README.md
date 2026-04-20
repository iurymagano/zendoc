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

**Criação e edição manual:**

- Botão "Novo agendamento" abre um formulário inline no topo da página
  (nome + telefone + `datetime-local` início/fim + notas).
- O input de nome do paciente tem autocomplete: ao focar ou digitar, mostra
  sugestões de pacientes já cadastrados (filtra por nome OU telefone).
  Clicar em uma sugestão preenche nome + telefone de uma vez. A lista de
  pacientes é carregada via `GET /api/patients` no mount da página e
  atualizada após cada criação de agendamento (cobre o caso de criar
  paciente novo pelo próprio form da agenda).
- Ao preencher o início, o fim é auto-preenchido para `+50min` (apenas se
  estava vazio ou inválido).
- Botão "Editar" em cada item abre o mesmo formulário pré-preenchido e
  manda `PATCH /api/appointments/:id`.

**Ações por status:**

- `pending_approval` → Aprovar (`PATCH status=scheduled`) · Rejeitar
  (`POST /cancel`).
- `scheduled` → Confirmar (`PATCH status=confirmed`) · Editar · Cancelar.
- `confirmed` → Não compareceu (`PATCH status=no_show`) · Editar · Cancelar.
- `cancelled` / `no_show` → Editar (para corrigir notas).

**Cancelamento:** usa `window.confirm` + `window.prompt` para capturar motivo
e chama `POST /api/appointments/:id/cancel`. Fica registrado em
`cancellation_note` e `cancelled_by = 'professional'`.

**Notas:**

- Horários enviados em ISO com offset `-03:00`. O input `datetime-local` dá
  `YYYY-MM-DDTHH:mm`; o cliente appenda `:00-03:00` antes de enviar.
- Status badges usam cores do tema (primary/emerald/amber/muted/destructive)
  — quando o shadcn `badge` for instalado, migrar para componente dedicado.
