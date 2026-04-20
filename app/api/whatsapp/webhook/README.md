# app/api/whatsapp/webhook/

Endpoint **público** — recebe eventos `on-message-received` da **Z-API**.

## route.ts

**Endpoint:** `POST /api/whatsapp/webhook?instance={zapi_instance_id}`

**Autenticação:** header `client-token` deve bater com
`process.env.ZAPI_CLIENT_TOKEN`. Sem match → 401. Configurado no painel
Z-API em Configurações → Webhooks.

**Payload esperado (formato Z-API):**

```json
{
  "phone": "5511999999999",
  "text": { "message": "texto da mensagem" },
  "fromMe": false,
  "isGroup": false
}
```

**Fluxo:**

1. Valida `client-token`. 401 se inválido.
2. Ignora `fromMe: true` e `isGroup: true`.
3. Lê `?instance=` da URL (a Z-API chama URLs diferentes por instância —
   a URL com query é configurada em cada instância no painel).
4. Extrai `body.phone` e `body.text.message`.
5. Busca `professional` pelo `zapi_instance_id`. Descarta se ausente.
6. Descarta se `ai_enabled = false` ou plano `past_due`/`cancelled`.
7. Descarta com log se `zapi_token` estiver ausente (inconsistência de dados).
8. Chama `processWhatsAppMessage(professional, phone, message)` — mesmo
   processor usado pelo `POST /api/ai/test`.
9. Responde via `sendWhatsAppMessage(instanceId, token, phone, reply)`.

**Retorna sempre `200 { ok: true }`** (exceto 401 de token inválido) para
evitar retries da Z-API. Erros durante processamento só são logados.

**Configuração no painel Z-API:**

- URL: `https://sua-url.com/api/whatsapp/webhook?instance={INSTANCE_ID}`
  (substitua `{INSTANCE_ID}` pelo id daquela instância).
- Enviar Client-Token: ativo; valor = `ZAPI_CLIENT_TOKEN`.
- Ativar apenas o evento "Ao receber".

**Depende de:**

- `@/lib/supabase`
- `@/lib/ai/processor` (`processWhatsAppMessage`)
- `@/lib/zapi/client` (`sendWhatsAppMessage`)
