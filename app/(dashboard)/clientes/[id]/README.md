# app/(dashboard)/clientes/[id]/

Página de detalhe + histórico completo de um cliente.

## page.tsx

**O que faz:** server component que busca o cliente e todos os seus
appointments, separando em "Próximos atendimentos" e "Histórico".

**Fluxo:**

1. Valida sessão → redireciona para `/login` se não autenticado.
2. Busca `professional.id` do usuário logado.
3. Busca o `patient` filtrando por `id` + `professional_id` (isolamento entre
   profissionais). `notFound()` se não existir.
4. Busca appointments com `patient_id = id` e separa:
   - **Próximos atendimentos:** `starts_at >= now` e status ativo (`scheduled`,
     `confirmed`, `pending_approval`) — ordenados ascendentemente (próximo
     primeiro).
   - **Histórico:** tudo que for passado ou `cancelled`/`no_show` — ordenado
     descendentemente (mais recente primeiro).

**Seções na UI:**

- Header com nome, telefone formatado, data de cadastro e atalho para
  "Novo agendamento".
- Card "Anotações clínicas" (só aparece se `patient.notes` tiver conteúdo).
- Card "Próximos atendimentos" com items de appointment (horário, status,
  origem IA/manual, notas, motivo de cancelamento se houver).
- Card "Histórico" com o mesmo formato, appointments cancelados/no_show com
  `opacity-60`.

**Depende de:**

- `@/auth`, `@/lib/supabase`
- `@/components/ui/{card,button}`, `@/components/appointments/StatusBadge`
- `@/types/database`

**Notas:**

- Appointments criados antes da deleção do cliente perdem o vínculo
  (`ON DELETE SET NULL` no FK) e **não aparecem aqui** — ainda ficam em
  `/agenda` com `patient_name`/`patient_phone` desnormalizados.
- O status de cada atendimento usa `StatusBadge` (`components/appointments/status.ts`, ícone + rótulo), a mesma fonte da agenda e do dashboard.
- Edição de cliente e de appointment continua sendo feita em `/clientes`
  e `/agenda` respectivamente — esta página é read-only (view).
