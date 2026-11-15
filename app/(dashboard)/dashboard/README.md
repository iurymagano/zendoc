# app/(dashboard)/dashboard/

Página inicial após o login: o dia do profissional, o que precisa de ação e como está a semana.

## page.tsx

**O que faz:** Server Component. Lê a sessão (`auth()`), busca o `professional` e chama
`loadDashboard()` (`lib/dashboard/load.ts`). Redireciona para `/login` sem sessão e para
`/onboarding/step-1` sem perfil. Monta os blocos de `components/dashboard/home/`.

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/name`, `@/lib/dashboard/load`,
`@/components/dashboard/home/*`, `@/components/billing/PlanStatusBanner`.

**Blocos e de onde vem cada número:**

| Bloco | Fonte |
| --- | --- |
| Hoje (contagem, agora/próximo, régua do dia) | `appointments` de hoje + `availability_weekly`/`availability_exceptions` |
| Atenção (aprovações, conversas) | `appointments.status='pending_approval'`, `conversation_state` (`needs_attention`, `ai_paused`) |
| Próximos | `appointments` ativos a partir de agora + `services` (nome) |
| Semana (atendimentos, pela IA, ocupação, comparecimento) | `appointments` (`booked_via`, `status`), horários semanais e exceções, `google_busy_events` |
| Clientes novos | `patients.created_at` na semana |
| Tempo poupado | ESTIMATIVA: agendamentos da IA na semana x 5 min (conta mostrada na tela) |
| Vagas | `getAvailableSlots` (14 dias, mostra 6) |
| Conversas recentes | `conversation_history` + `patients` (nome) |
| Configuração | `professionals` (WhatsApp, Google), `availability_weekly`, `services` |
| Teste grátis | `professionals.plan_status` + `trial_ends_at` |

**Notas:** conta nova (sem horários e sem atendimentos) troca o topo pelo passo a passo
(`SetupHero`). Em telas pequenas a ordem é: alerta do WhatsApp, hoje, atenção, próximos,
conversas, configuração, semana, vagas. Sem migration: só lê tabelas existentes. A única
escrita é o `PATCH /api/appointments/[id]` do botão Aprovar/Confirmar.

**Notas (revisão visual):** `Sua semana` troca de coluna no desktop conforme o passo a passo aparece (equilibra a altura das colunas); a ordem no celular é a mesma.
