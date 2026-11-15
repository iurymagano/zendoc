# lib/dashboard/

Contas e carregamento de dados da página inicial `/dashboard`. As contas são puras (sem banco, sem rede, fuso America/Sao_Paulo via `lib/assistant/datetime.ts`) e testadas.

---

## schedule.ts

**O que faz:** semana, ocupação e a régua do dia.

**Exporta:**

- `weekOf(now): WeekInfo` — segunda a domingo que contém hoje.
- `dayWindows(date, weekly, exceptions): [ms, ms][]` — janelas em que o profissional atende.
- `weekOccupancy({ now, weekly, exceptions, appointments, busy }): WeekOccupancy` — por dia: capacidade, minutos ocupados, bloqueados (Google), livres e `count` (atendimentos e compromissos pessoais ativos que começam no dia; só serve de altura mínima da barra, o gráfico mostra horas ocupadas, não contagem); total e `occupancyPct` (null sem horário).
- `dayRuler({ now, date, weekly, exceptions, appointments }): DayRuler | null` — ticks, janelas, segmentos, posição de "agora" e quanto já passou.

**Depende de:** `lib/availability/compute.ts` (`buildBlocks`), `lib/assistant/datetime.ts`.

## summary.ts

**O que faz:** agregações do dia, dos próximos atendimentos, da semana e das conversas.

**Exporta:** `todaySummary`, `upcomingGroups`, `dayLabel`, `weekMetrics`, `attendanceStats`, `timeSavedEstimate`, `formatDuration`, `latestByPhone`, `snippet`, `relativeTime`, `isActiveStatus` e os tipos `DashAppointment`, `TodaySummary`, `WeekMetrics`, `Attendance`, `TimeSaved`.

**Notas:** regra única da semana: `weekMetrics` (`total`, `byAi`, `remaining`) conta só clientes, sem compromisso pessoal (sem telefone), sem `cancelled` e sem `no_show`; `cancelled` conta só os cancelados. A ocupação (`weekOccupancy`) é outra medida: compromisso pessoal ocupa horário, e o gráfico fala em horas, não em atendimentos. `attendanceStats` considera "compareceu" tudo que passou sem ser marcado `no_show` (o sistema não registra presença) e só devolve taxa com base mínima (5 atendimentos). `timeSavedEstimate` é estimativa (5 min por agendamento da IA) e devolve a fórmula para a tela mostrar.

## setup.ts

**O que faz:** saudação, checklist de configuração e dias de teste.

**Exporta:** `greeting(now)`, `buildSetup({ whatsappConnected, weeklyBlocks, services, googleConnected }): Setup`, `trialInfo(planStatus, trialEndsAt, now): TrialInfo | null`.

## load.ts

**O que faz:** busca tudo no Supabase (service key, ~13 consultas em paralelo) e devolve `DashboardData` já agregado.

**Exporta:** `loadDashboard(professional, now?): Promise<DashboardData>`, tipos `DashboardData`, `ConversationItem`.

**Notas:** SERVIDOR APENAS; toda consulta filtra por `professional.id` (vem da sessão). Erros de consulta são logados e o bloco fica vazio, a página não quebra. `isNew` = sem horários e sem nenhum atendimento.

## schedule.test.ts, summary.test.ts, setup.test.ts

Testes `node:test` das contas acima, com relógio fixo (sábado 14/11/2026 16:57 -03:00); rodam com `npm test` e foram conferidos com `TZ=UTC`, `America/Sao_Paulo` e `Asia/Tokyo`.

## load.ts

**Notas (redesign premium):** `DashboardData` ganhou `upcomingCount` (total de atendimentos ativos a partir de agora, contagem exata da mesma consulta de próximos) e `aiTotal` (agendamentos `booked_via='whatsapp_ai'` não cancelados, consulta `head` só de contagem). Ambas só leem; alimentam os MetricCards "Próximos" e "Pela IA".
