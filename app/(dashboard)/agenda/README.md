# app/(dashboard)/agenda/

Calendário visual de agendamentos — vistas **Mês** e **Semana** (estilo Google
Calendar). Mostra os appointments do IAzen e os compromissos pessoais
sincronizados do Google Calendar (read-only).

## page.tsx

**O que faz:** client component que orquestra dados, navegação, troca de vista
(Mês/Semana) e o formulário de criar/editar.

**Fluxo:**

1. Estado `view` (`'month' | 'week'`, default semana) + `cursor` (data de
   referência). `rangeFor(view, cursor)` define a janela buscada:
   - semana → segunda a domingo da semana do cursor;
   - mês → grade completa (segunda antes do dia 1 até o fim da última semana).
2. `GET /api/appointments?from&to` devolve `{ appointments, googleBusy }`,
   guardados em estado.
3. Renderiza `<CalendarMonth>` ou `<CalendarWeek>` (em `components/agenda/`).

**Navegação:** seletor Mês/Semana, setas ← →（passo de 1 mês ou 7 dias conforme
a vista) e botão "Hoje".

**Auto-sync do Google:** ao montar, ao a aba voltar ao foco e a cada 60s, a
página dispara `POST /api/google/calendar/sync` (throttle de 30s) e recarrega os
dados se algo mudou. Cobre o dev, onde não há push do Google (sem https público);
em prod o watch já mantém atualizado. Quando o Google não está conectado, a rota
responde 200 silencioso (`{ connected: false }`) e o auto-sync não faz nada.

**Criação e edição:**

- "Novo agendamento" abre o formulário inline. Clicar num **dia** (mês) ou numa
  **faixa de hora** (semana) abre o form já com a data/hora pré-preenchida.
- Clicar num **bloco de agendamento** abre o form em modo edição, com as ações
  de status no topo (Aprovar/Confirmar/Não compareceu/Cancelar conforme o status).
- Autocomplete de pacientes (nome OU telefone), campo CPF com máscara, fim
  auto-preenchido em `+50min`. Salva via `POST`/`PATCH /api/appointments`.

**Cancelamento:** `window.confirm` + `window.prompt` (motivo) →
`POST /api/appointments/:id/cancel`.

**Declaração de comparecimento:** no form de edição (consulta não cancelada),
o botão "Declaração" abre `/documentos/declaracao/[id]` em nova aba (documento
imprimível). Ver `app/documentos/`.

**Consultas recorrentes:** no form de criação, o campo "Repetir" (Não repete /
Toda semana / A cada 2 semanas) + "Repetir até" opcional cria uma série via
`POST /api/recurrences` (materializa as ocorrências) em vez de um único
appointment. Ocorrências recorrentes mostram 🔁 no calendário; no form de edição
de uma delas há o aviso da série e o botão "Encerrar série"
(`POST /api/recurrences/:id/stop`). Editar/cancelar uma ocorrência afeta só ela.

**Depende de:**

- `@/components/agenda/{CalendarMonth,CalendarWeek,calendar-utils}`
- `@/components/ui/{button,input,textarea,card,form-field}`
- `GET /api/appointments`, `POST/PATCH /api/appointments`, `POST /api/appointments/:id/cancel`
- `@/lib/patients/cpf`, `date-fns`

**Notas:**

- Horários em ISO com offset `-03:00`; o `datetime-local` recebe `:00-03:00`.
- Posicionamento/agrupamento dos blocos usa helpers de fuso (`tzDateKey`,
  `tzMinutes`) fixados em `America/Sao_Paulo` (ver `calendar-utils.ts`).
- Os compromissos do Google aparecem read-only (cinza/tracejado) e também
  bloqueiam a disponibilidade oferecida pela IA (ver `lib/availability/slots.ts`).
