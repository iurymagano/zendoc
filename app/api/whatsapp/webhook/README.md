# app/api/whatsapp/webhook/

Endpoint **público** — recebe eventos `messages.upsert` e `connection.update` da **Evolution API**.

## route.ts

**Endpoint:** `POST /api/whatsapp/webhook?secret={WEBHOOK_SECRET}`

**Autenticação:** `?secret=` da URL deve bater com
`process.env.WEBHOOK_SECRET`. Sem match → 401. A URL (com o secret) é
registrada no `POST /instance/create`.

**Payload esperado (formato Evolution):**

```json
{
  "event": "messages.upsert",
  "instance": "iazen_<professionalId>",
  "data": {
    "key": { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false },
    "message": { "conversation": "texto da mensagem" }
  }
}
```

**Fluxo:**

1. Valida `?secret=`. 401 se inválido.
2. `connection.update` (ou `CONNECTION_UPDATE`) vai para `handleConnectionUpdate`
   ([lib/zapi/connection-update.ts](../../../../lib/zapi/connection-update.ts)):
   mantém `whatsapp_connected` em dia e, quando o número cai de vez, cria o aviso
   "WhatsApp desconectado" no sino. Qualquer outro evento que não seja
   `messages.upsert` é ignorado.
3. `data` pode vir como objeto ou array (pega o primeiro).
4. Ignora `data.key.fromMe = true` e `remoteJid` em `@g.us` (grupo).
5. Extrai telefone do `remoteJid` (dígitos antes do `@`) e o texto de
   `message.conversation` ou `message.extendedTextMessage.text`.
6. Lê `body.instance` e busca `professional` por `zapi_instance_id`.
7. Descarta se ausente, `ai_enabled = false` ou plano `past_due`/`cancelled`.
8. `processWhatsAppMessage(professional, phone, message)` — mesmo processor do
   `POST /api/ai/test`.
9. Responde via `sendWhatsAppMessage(instanceName, token, phone, reply)`.

**Avisos no sino** (nunca mudam a resposta nem o status HTTP):

- IA pausada para o contato (handoff manual) e o cliente escreveu →
  `notifyConversationAttention({ reason: 'paused' })`.
- Falha ao enviar a resposta pela Evolution → `notifyReplyFailed` (motivo amigável;
  no máximo um aviso por contato a cada 30 min) e o erro continua sendo logado.

**Retorna sempre `200 { ok: true }`** (exceto 401), para evitar retries.
Erros de processamento só são logados.

**Configuração na Evolution:**

- O webhook é registrado automaticamente no `createInstance` com a URL
  `${NEXT_PUBLIC_URL}/api/whatsapp/webhook?secret=${WEBHOOK_SECRET}` e os
  eventos `MESSAGES_UPSERT` / `CONNECTION_UPDATE`.

**Depende de:**

- `@/lib/supabase`
- `@/lib/ai/processor` (`processWhatsAppMessage`)
- `@/lib/zapi/client` (`sendWhatsAppMessage`), `@/lib/zapi/connection-update`,
  `@/lib/zapi/connection-event`, `@/lib/notifications/events`
