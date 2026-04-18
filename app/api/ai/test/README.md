# app/api/ai/test/

Endpoint de teste manual do fluxo de IA — útil para validar prompts, execução
de ações e persistência de histórico enquanto o WhatsApp ainda não está plugado.

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

**Resposta 200:** `{ "reply": "texto que seria enviado ao paciente" }`

**Erros:** 401 (sem sessão), 404 (sem perfil em `professionals`), 400
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
