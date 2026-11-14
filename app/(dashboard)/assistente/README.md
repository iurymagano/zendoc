# app/(dashboard)/assistente/

Tela do Assistente pessoal: chat do profissional com a IA para consultar a agenda, marcar atendimentos e criar lembretes.

---

## page.tsx

**O que faz:** página client (`/assistente`) com o chat à esquerda e a lista de lembretes pessoais à direita (abaixo, no celular).

**Exporta:** `AssistentePage` (default).

**Comportamento:**

- Carrega o histórico em `GET /api/assistant/messages` e envia cada mensagem em `POST /api/assistant/chat`.
- Estado "pensando…" enquanto a IA responde (pode levar alguns segundos: o loop faz várias chamadas).
- Chips de ação sob a resposta ("Atendimento criado: …", "Lembrete criado: …") vêm do campo `actions` da API.
- Sugestões na tela vazia: algumas enviam na hora ("O que tenho amanhã?"), outras só preenchem o campo ("Me lembra de…").
- Lembretes: lista os pendentes (próximos primeiro) com botão **Cancelar** (`POST /api/assistant/reminders/[id]/cancel`) e os 5 últimos enviados/falhados (com o motivo da falha, ex.: "WhatsApp não conectado"). Atualiza depois de cada resposta do chat.
- Erro de rede/IA vira bolha de erro na conversa; plano inativo (402) mostra a mensagem da API.

**Visual:** o chat é um painel Void (`rounded-3xl`) com o logo, status "online" com a faísca pulsando e balões em degraus de Void (usuário em violeta de ação). Estado "pensando" = três pontos da faísca (`ia-spark`, só transform/opacity, desligado com reduced-motion) e o cabeçalho troca para "pensando…". Tela vazia com o símbolo e a pergunta "O que você precisa hoje?". Lembretes ficam num card claro ao lado.

**Depende de:** `@/components/ui/*` (shadcn), `@/components/dashboard/{PageHeader,EmptyState}`, `@/lib/assistant/datetime` (`formatBrDateTime`), `app/api/assistant/*`.

**Notas:** `'use client'` porque usa estado e `fetch`. A página não conhece a regra de plano — quem bloqueia é a API.
