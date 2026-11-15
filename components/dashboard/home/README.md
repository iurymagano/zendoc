# components/dashboard/home/

Blocos da página inicial `/dashboard`. Todos são Server Components, menos `ApproveButton`. Os dados chegam prontos de `lib/dashboard/load.ts`.

---

## Panel.tsx

**O que faz:** card branco de 28px sem linha nem sombra, com cabeçalho (rótulo mono + título Sora + ação).
**Exporta:** `Panel({ label, title?, action?, className?, children })`, `SectionLabel` (rótulo "// TEXTO" em JetBrains Mono, caixa alta).

## chips.tsx

**O que faz:** chips de status (sempre com texto; rótulo e cores vêm de `components/appointments/status.ts`) e de origem do atendimento (IA no WhatsApp, Manual, Pessoal).
**Exporta:** `StatusChip({ status })`, `OriginChip({ via, personal })`.

## ApproveButton.tsx

**O que faz:** (client) botão de ação rápida. `mode='approve'` aprova um pedido (`PATCH /api/appointments/[id]` com `scheduled`), `mode='confirm'` confirma (`confirmed`); depois `router.refresh()`.
**Exporta:** `ApproveButton({ id, mode })`.

## DayRuler.tsx

**O que faz:** a régua do dia: janela de atendimento, blocos dos atendimentos, "agora" com a faísca e o trecho já vivido em degradê (o único degradê do painel).
**Exporta:** `DayRulerView({ ruler, items, now, summary })`.

## Hero.tsx

**O que faz:** saudação, resumo do dia, número grande de atendimentos, "Agora/Próximo" e a régua.
**Exporta:** `Hero({ data, firstName })`.

## Alerts.tsx

**O que faz:** alerta forte (Void) de WhatsApp desconectado e faixa do teste grátis com CTA de assinatura.
**Exporta:** `WhatsAppAlert()`, `TrialStrip({ trial })`.

## Attention.tsx

**O que faz:** "Precisam de você": aprovações pendentes (com Aprovar), conversas em que a IA pediu ajuda e conversas pausadas. Some se não há nada.
**Exporta:** `Attention({ pending, pendingCount, needsReply, paused, now })`.

## Upcoming.tsx

**O que faz:** próximos atendimentos por dia, com origem, status e Confirmar nos agendados.
**Exporta:** `Upcoming({ groups, serviceNames })`.

## WeekPanel.tsx

**O que faz:** números da semana, gráfico de ocupação por dia (CSS; sob cada barra, as horas ocupadas, incluindo compromissos pessoais), comparecimento (só com base) e tempo poupado (estimativa com a conta à mostra).
**Exporta:** `WeekPanel({ data })`.

## FreeSlots.tsx

**O que faz:** próximos horários livres que a IA oferece, com estado vazio que leva a Disponibilidade.
**Exporta:** `FreeSlots({ slots, availabilityConfigured, now })`.

## Conversations.tsx

**O que faz:** últimas conversas do WhatsApp (nome ou telefone, trecho, quando).
**Exporta:** `Conversations({ items, now })`.

## SetupChecklist.tsx

**O que faz:** checklist de configuração (WhatsApp, horários, serviços, Google Agenda) com progresso.
**Exporta:** `SetupHero({ setup, firstName })` (conta nova, topo da página, barra em degradê) e `SetupCard({ setup })` (conta em uso, barra sólida).

**Notas gerais:** o WhatsApp pendente é o único item em Void. Vocabulário "cliente"/"atendimento".

## Revisão visual (nov/2026)

- `Hero.tsx`: dia sem rotina e agenda vazia viram uma caixa só (texto + "Ajustar horários" + "Marcar um atendimento"); o aviso separado só aparece se houver compromisso num dia sem rotina.
- `SetupChecklist.tsx`: a barra de progresso usa a largura real (0% = vazia), sem mínimo.
- `Panel.tsx`: novo `EmptyState({ title, children, href, cta })`, o estado vazio padrão dos cards (texto na cor da tinta, botão primário para a rota que resolve). Usado em `Upcoming` (/agenda), `Conversations` (/configuracoes/whatsapp ou /configuracoes/testar-ia, conforme `whatsappConnected`), `WeekPanel` e `FreeSlots` (/configuracoes/disponibilidade).
- `Conversations({ items, now, whatsappConnected })`: nova prop.
- `SetupChecklist.tsx`: o título da conta nova usa `text-wrap: balance` e `&nbsp;` antes de "secretária" (sem palavra sozinha na linha).

