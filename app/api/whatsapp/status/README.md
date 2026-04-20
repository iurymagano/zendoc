# app/api/whatsapp/status/

## route.ts

**Endpoint:** `GET /api/whatsapp/status`

**Autenticação:** sessão NextAuth obrigatória.

**Resposta 200:**

```json
{
  "provisioned": true,
  "connected": false,
  "qrcode": "base64-ou-null"
}
```

- `provisioned` — `true` se `zapi_instance_id` e `zapi_token` existirem no
  banco. Se `false`, a UI orienta o profissional a contactar o suporte.
- `connected` — resultado de `GET /status` na Z-API. Também sincroniza
  `professionals.whatsapp_connected` no banco a cada chamada.
- `qrcode` — quando `connected = false`, traz o QR atual via
  `GET /qr-code/image` na Z-API. Quando `connected = true`, vem `null`.

**Erros:** `401`, `404` (perfil), `500` (erro da Z-API).

**Notas:**

- A UI de `/configuracoes/whatsapp` faz polling desse endpoint a cada 3s
  enquanto aguarda scan. Quando `connected = true`, o polling é encerrado.
- Como a Z-API não envia `connection.update` via webhook, é esta rota que
  detecta a conexão (no próximo poll após o scan).
