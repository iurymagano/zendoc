# components/appointments/

Tudo que descreve um atendimento na interface: o status (fonte única) e as peças que o mostram.

---

## status.ts

**O que faz:** fonte única do status do atendimento no painel: rótulo, descrição, ícone e classes (pílula, bloco do calendário, quadradinho da legenda).

**Exporta:**

- `STATUS: Record<AppointmentStatus, StatusConfig>` — `{ label, description, icon, badge, block, swatch }`
- `STATUS_ORDER` — ordem de exibição (agendado, confirmado, pendente, cancelado, faltou)
- `statusConfig(status)` — acesso por função
- `StatusConfig` — tipo

**Depende de:** tokens `--status-*` de `app/globals.css` (mapeados em `@theme inline` como `status-scheduled`, `status-scheduled-soft` etc.), `lucide-react`, `types/database`.

**Notas:** a cor nunca é a única pista: todo status tem texto e ícone, pendente tem borda tracejada e cancelado é riscado. As classes ficam como strings literais para o Tailwind as enxergar. `agenda/calendar-utils.ts` e `dashboard/home/chips.tsx` leem daqui; não crie outro mapa de status.

---

## StatusBadge.tsx

**O que faz:** pílula de status (ícone + rótulo) sobre o `Badge` do shadcn (variante `plain`).

**Exporta:** `StatusBadge({ status, iconOnly?, className? })`. `iconOnly` esconde o texto só da vista (`sr-only`). O `title` traz a descrição.

---

## AppointmentCard.tsx

**O que faz:** linha de atendimento: horário em mono, nome, detalhe, badges de origem e `StatusBadge`; ações opcionais fora do link.

**Exporta:** `AppointmentCard({ startsAt, endsAt?, title, detail?, status?, href?, badges?, actions?, className? })`.

**Depende de:** `StatusBadge`, `formatTime` de `components/agenda/calendar-utils` (fuso America/Sao_Paulo).

**Notas:** sem `status` (compromisso pessoal) não mostra badge. Cancelado fica com o nome riscado. Server Component.
