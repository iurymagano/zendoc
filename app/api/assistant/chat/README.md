# app/api/assistant/chat/

Um turno do chat do Assistente pessoal.

## route.ts

**Endpoint:** `POST /api/assistant/chat`

**Payload:** `{ "message": "Marca a Maria amanhã às 14h" }` — 1 a 2000 caracteres (aparados).

**Resposta 200:**

```json
{ "reply": "Pronto! Atendimento com a Maria na quarta, 18/11 às 14:00.", "actions": ["Atendimento criado: qua, 18/11 às 14:00"] }
```

`actions` lista só o que **alterou dados** neste turno (a UI mostra como chips); vem `[]` em
atendimentos e conversa.

**Erros:** 401 (sem sessão), 404 (sem perfil), **402** (plano fora de `trialing`/`active`, com
mensagem clara), 400 (mensagem vazia/longa), 500 (falha no modelo ou no banco — `console.error`).

**Comportamento:** carrega o profissional da sessão, bloqueia por plano e chama
`runAssistantChat` ([lib/assistant/chat.ts](../../../../lib/assistant/chat.ts)): histórico →
loop de tool use → grava as duas mensagens em `assistant_messages`.

**Depende de:** `@/auth`, `@/lib/assistant/access`, `@/lib/assistant/chat`

**Notas:** `maxDuration = 60` porque o loop pode chamar o modelo várias vezes. Cada mensagem
gera custo na Anthropic (modelo em `AI_MODEL`).
