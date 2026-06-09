# app/api/conversations/

Caixa de conversas do WhatsApp + handoff (pausar a IA por contato). Lê de
`conversation_history`; o estado de pausa fica em `conversation_state`.

## route.ts

- **`GET /api/conversations`** — lista as conversas do profissional (uma por
  telefone) com última mensagem, nome do paciente (se cadastrado) e `ai_paused`.
  Reduz as ~400 mensagens mais recentes a uma entrada por telefone.

- **`GET /api/conversations/attention-count`** — `{ count }` de conversas que
  precisam de resposta (badge do Navbar). Rota estática (precede `/[phone]`).

## Subpastas

- [\[phone\]/](./[phone]/) — `GET` mensagens da conversa (+ nome + `ai_paused` +
  `needs_attention`).
- [\[phone\]/pause/](./[phone]/pause/) — `POST { paused }` pausa/retoma a IA.
- [\[phone\]/send/](./[phone]/send/) — `POST { message }` envia mensagem manual
  pelo WhatsApp e grava como `assistant`. Exige WhatsApp conectado.

**Notas:** quando `ai_paused` é true, o webhook do WhatsApp guarda a mensagem
recebida mas **não** aciona a IA (`lib/conversations/state.ts`). `needs_attention`
é setado pela IA (ação `handoff` ou fallback) e limpo quando o profissional
responde. As conversas que precisam de resposta vêm primeiro na lista. O `phone`
na URL deve ser `encodeURIComponent` (pode ser dígitos ou um JID `@lid`).
