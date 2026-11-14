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
mensagem clara), 400 (mensagem vazia/longa), **429** (limite de uso, abaixo), 500 (falha no modelo
ou no banco — `console.error`). Todo erro vem como `{ "error": "mensagem" }` e a tela do chat
mostra essa mensagem como resposta do assistente.

**Limite de uso (429):** por profissional, **30 mensagens em 10 min** e **200 por 24h**, contando as
linhas `role='user'` de `assistant_messages`. Passou do limite → `429` com `{ "error": "Você enviou
muitas mensagens em pouco tempo. Aguarde um pouco e tente de novo em cerca de 10 min." }` (ou o
texto do limite diário) e header `Retry-After` em segundos. A checagem roda **antes** do modelo, então
a requisição bloqueada não gasta tokens. Regra em
[lib/assistant/rate-limit.ts](../../../../lib/assistant/rate-limit.ts).

**Comportamento:** carrega o profissional da sessão, bloqueia por plano, valida o corpo, aplica o limite
e chama `runAssistantChat` ([lib/assistant/chat.ts](../../../../lib/assistant/chat.ts)): histórico →
loop de tool use → grava as duas mensagens em `assistant_messages`.

**Depende de:** `@/auth`, `@/lib/assistant/access`, `@/lib/assistant/chat`, `@/lib/assistant/rate-limit`, `@/lib/supabase`

**Notas:** `maxDuration = 60` porque o loop pode chamar o modelo várias vezes. Cada mensagem
gera custo na Anthropic (modelo em `AI_MODEL`), daí o limite. O limite é aproximado: a linha do usuário só
é gravada no fim do turno, então requisições paralelas podem passar juntas e turnos que falham não
contam. Se a leitura das datas falhar, o chat segue (só loga o erro).
