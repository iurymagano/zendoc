# components/dashboard/home/

Blocos da página inicial `/dashboard`. Todos são Server Components, menos `ApproveButton`. Os dados chegam prontos de `lib/dashboard/load.ts`. Cards com raio 16 (`--radius-card`), sem linha nem sombra; títulos de bloco em Inter semibold via `SectionHeader` (sem rótulo mono em caixa alta).

---

## Panel.tsx

**O que faz:** card branco com cabeçalho (`SectionHeader`: título + descrição + ação), mais o link de ação e o estado vazio padrão.
**Exporta:** `Panel({ title, description?, action?, id?, className?, children })`, `PanelLink({ href, children })` (link discreto "Ver todas" etc.), `EmptyState({ title, children, href, cta, className? })` (texto na tinta, botão primário para a rota que resolve).

## DashboardHeader.tsx

**O que faz:** cabeçalho compacto: saudação (Sora), data por extenso com o resumo do dia e o botão "Novo agendamento" (abre o formulário em `/agenda?novo=1`).
**Exporta:** `DashboardHeader({ data, firstName })`.

## Metrics.tsx

**O que faz:** 4 `MetricCard` com dado real: Hoje (atendimentos + agora/próximo), Próximos (total futuro + aprovações pendentes), Clientes (total + novos na semana) e Pela IA (total marcado pela IA + na semana). Sem número inventado; cada card tem dica honesta quando está zerado.
**Exporta:** `Metrics({ data, whatsappConnected })`.

## Upcoming.tsx

**O que faz:** próximos atendimentos por dia com `AppointmentCard`; a linha abre o dia na agenda (`/agenda?date=`). Origem e Confirmar só aparecem de `sm` para cima (no celular a linha mostra horário, nome e status).
**Exporta:** `Upcoming({ groups, serviceNames })`.

## StatusCard.tsx

**O que faz:** "Sua secretária": IA ligada/pausada, WhatsApp conectado/desconectado (com "Conectar"), quantos aguardam o profissional e atalho para as configurações.
**Exporta:** `StatusCard({ data, aiEnabled, whatsappConnected })`.

## TodayPanel.tsx

**O que faz:** "Seu dia": linha Agora/Próximo e a régua do dia.
**Exporta:** `TodayPanel({ data })`.

## Attention.tsx

**O que faz:** "Precisam de você" (`id="atencao"`): aprovações pendentes (com Aprovar), conversas em que a IA pediu ajuda e conversas pausadas. Some se não há nada.
**Exporta:** `Attention({ pending, pendingCount, needsReply, paused, now })`.

## WeekPanel.tsx

**O que faz:** números da semana, gráfico de ocupação por dia (CSS; sob cada barra, as horas ocupadas, incluindo compromissos pessoais), comparecimento (só com base) e tempo poupado (estimativa com a conta à mostra).
**Exporta:** `WeekPanel({ data })`.

## FreeSlots.tsx

**O que faz:** "Vagas que a IA oferece": próximos horários livres, com estado vazio que leva a Disponibilidade.
**Exporta:** `FreeSlots({ slots, availabilityConfigured, now })`.

## Conversations.tsx

**O que faz:** últimas conversas do WhatsApp (nome ou telefone, trecho, quando).
**Exporta:** `Conversations({ items, now, whatsappConnected })`.

## DayRuler.tsx

**O que faz:** a régua do dia: janela de atendimento, blocos dos atendimentos, "agora" com a faísca e o trecho já vivido em degradê (o único degradê do painel).
**Exporta:** `DayRulerView({ ruler, items, now, summary })`.

## Alerts.tsx

**O que faz:** faixa fina de WhatsApp desconectado e faixa do teste grátis (dias restantes + CTA de assinatura).
**Exporta:** `WhatsAppAlert()`, `TrialStrip({ trial })`.

## SetupChecklist.tsx

**O que faz:** checklist de configuração (WhatsApp, horários, serviços, Google Agenda) com progresso real.
**Exporta:** `SetupHero({ setup, firstName })` (conta nova, topo da página) e `SetupCard({ setup })` (conta em uso: lista compacta e só o CTA do próximo passo). Barra de progresso sólida nos dois.

## chips.tsx

**O que faz:** chips de status (rótulo e cores vêm de `components/appointments/status.ts`) e de origem do atendimento (IA no WhatsApp, Manual, Pessoal).
**Exporta:** `StatusChip({ status })`, `OriginChip({ via, personal })`.

## ApproveButton.tsx

**O que faz:** (client) botão de ação rápida. `mode='approve'` aprova um pedido (`PATCH /api/appointments/[id]` com `scheduled`), `mode='confirm'` confirma (`confirmed`); depois `router.refresh()`.
**Exporta:** `ApproveButton({ id, mode })`.

**Notas gerais:** vocabulário "cliente"/"atendimento". O antigo `Hero.tsx` e o `SectionLabel` foram removidos (redesign premium).
