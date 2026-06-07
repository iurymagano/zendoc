# app/api/ai/test/

Endpoint de teste manual do fluxo de IA — útil para validar prompts, execução
de ações e persistência de histórico enquanto o WhatsApp ainda não está plugado.

Consumido pela UI de chat de teste em
[/configuracoes/testar-ia](../../../(dashboard)/configuracoes/testar-ia/README.md).

## route.ts

**Endpoint:** `POST /api/ai/test`

**Payload:**

```json
{
  "phone": "5511999999999",
  "message": "Oi, quero marcar uma consulta para semana que vem"
}
```

- `phone` — somente dígitos, 11 a 13 caracteres (com DDI e DDD, sem `+`).
- `message` — 1 a 2000 caracteres.

**Resposta 200:**

```json
{
  "reply": "texto que seria enviado ao paciente",
  "action": "book | cancel | reschedule | offer_slots | reply | approval_needed",
  "booking": { "starts_at": "...", "ends_at": "..." },
  "cancel": { "appointment_id": "..." },
  "slots": ["..."]
}
```

(`booking`/`cancel`/`slots` vêm `null` quando não se aplicam. A UI de teste usa
`action` para mostrar o que a IA fez em cada resposta.)

## GET /api/ai/test

Sem `?phone`: lista as conversas do profissional (inbox tipo WhatsApp) —
`{ conversations: [{ phone, last, lastRole, lastAt, count }] }`, agrupando o
`conversation_history` por telefone (mais recente primeiro, limite 1000 linhas).

Com `?phone=...`: retorna as mensagens daquela conversa em ordem cronológica —
`{ messages: [{ role, content, created_at }] }`. Usado para abrir/retomar uma
conversa salva.

## DELETE /api/ai/test?phone=...

Limpa o `conversation_history` de um telefone (o contexto que a IA enxerga) para
o profissional logado. Não mexe em `appointments` — agendamentos feitos no teste
continuam na agenda. Usado pelo botão "Limpar histórico" do chat de teste.

**Resposta 200:** `{ "ok": true }`. **Erros:** 401, 404, 400 (telefone inválido), 500.

**Erros (POST):** 401 (sem sessão), 404 (sem perfil em `professionals`), 400
(validação), 500 (erro na IA ou no banco).

**Comportamento:**

1. Busca o `Professional` do usuário logado.
2. Chama `processWhatsAppMessage(professional, phone, message)` — o mesmo
   caminho que o webhook do WhatsApp vai usar em produção.
3. Retorna apenas a resposta textual. Ações (booking, cancel, reschedule) e a
   gravação em `conversation_history` acontecem no mesmo fluxo, como em
   produção.

**Notas:**

- O endpoint **cria appointments reais** se a IA decidir `book`. Use com um
  `phone` de teste e revise a agenda depois.
- Como o histórico é lido por `(professional_id, patient_phone)`, você pode
  simular conversas distintas usando telefones diferentes.
- Tráfego na Anthropic API gera custo — ~R$0,05 por mensagem com o prompt atual.
