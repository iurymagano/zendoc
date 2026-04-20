# app/(dashboard)/pacientes/[id]/

Página de detalhe + histórico completo de um paciente.

## page.tsx

**O que faz:** server component que busca o paciente e todos os seus
appointments, separando em "Próximas consultas" e "Histórico".

**Fluxo:**

1. Valida sessão → redireciona para `/login` se não autenticado.
2. Busca `professional.id` do usuário logado.
3. Busca o `patient` filtrando por `id` + `professional_id` (isolamento entre
   profissionais). `notFound()` se não existir.
4. Busca appointments com `patient_id = id` e separa:
   - **Próximas consultas:** `starts_at >= now` e status ativo (`scheduled`,
     `confirmed`, `pending_approval`) — ordenadas ascendentemente (próxima
     primeiro).
   - **Histórico:** tudo que for passado ou `cancelled`/`no_show` — ordenado
     descendentemente (mais recente primeiro).

**Seções na UI:**

- Header com nome, telefone formatado, data de cadastro e atalho para
  "Novo agendamento".
- Card "Anotações clínicas" (só aparece se `patient.notes` tiver conteúdo).
- Card "Próximas consultas" com items de appointment (horário, status,
  origem IA/manual, notas, motivo de cancelamento se houver).
- Card "Histórico" com o mesmo formato, appointments cancelados/no_show com
  `opacity-60`.

**Depende de:**

- `@/auth`, `@/lib/supabase`
- `@/components/ui/{card,button}`
- `@/types/database`

**Notas:**

- Appointments criados antes da deleção do paciente perdem o vínculo
  (`ON DELETE SET NULL` no FK) e **não aparecem aqui** — ainda ficam em
  `/agenda` com `patient_name`/`patient_phone` desnormalizados.
- Edição de paciente e de appointment continua sendo feita em `/pacientes`
  e `/agenda` respectivamente — esta página é read-only (view).
