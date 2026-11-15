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
| Métrica Hoje (contagem, agora/próximo) | `appointments` de hoje |
| Métrica Próximos | `appointments` ativos a partir de agora (contagem exata, `upcomingCount`) + pendentes |
| Métrica Clientes | `patients` (total e criados na semana) |
| Métrica Pela IA | `appointments` com `booked_via='whatsapp_ai'` não cancelados (`aiTotal`) e os da semana |
| Próximos atendimentos | `appointments` ativos a partir de agora + `services` (nome) |
| Atenção (aprovações, conversas) | `appointments.status='pending_approval'`, `conversation_state` |
| Sua secretária | `professionals` (`ai_enabled`, WhatsApp) + contagem de atenção |
| Seu dia (régua) | `appointments` de hoje + `availability_weekly`/`availability_exceptions` |
| Semana | `appointments`, horários semanais, exceções, `google_busy_events` |
| Tempo poupado | ESTIMATIVA: agendamentos da IA na semana x 5 min (conta mostrada na tela) |
| Vagas | `getAvailableSlots` (14 dias, mostra 6) |
| Conversas recentes | `conversation_history` + `patients` (nome) |
| Primeiros passos | `professionals` (WhatsApp, Google), `availability_weekly`, `services` |
| Teste grátis (faixa fina) | `professionals.plan_status` + `trial_ends_at` |

**Ordem:** cabeçalho compacto com "Novo agendamento", faixa do teste, 4 métricas e duas colunas (desktop `1.6fr/1fr`). Esquerda: Próximos, Atenção, Seu dia, Vagas, Conversas. Direita: Sua secretária, Primeiros passos (só enquanto incompleto), Sua semana. No celular as colunas viram uma só via `contents` + `order-*`: Próximos, Atenção, Secretária, Primeiros passos, Seu dia, Semana, Vagas, Conversas.

**Notas:** conta nova (sem horários e sem atendimentos) troca o topo pelo passo a passo (`SetupHero`). O alerta fino do WhatsApp só aparece quando o passo a passo não está na tela. Sem migration: só lê tabelas existentes. A única escrita é o `PATCH /api/appointments/[id]` do botão Aprovar/Confirmar. `loading.tsx` mostra o esqueleto.
