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

- `provisioned` — `true` se `zapi_instance_id` existir no banco. Se `false`, a
  UI mostra o botão "Conectar WhatsApp" (que provisiona via `/connect`).
- `connected` — resultado de `GET /instance/connectionState` na Evolution
  (`state === 'open'`). Sincroniza `professionals.whatsapp_connected` a cada
  chamada.
- `qrcode` — quando `connected = false`, traz o QR atual via
  `GET /instance/connect`. Quando `connected = true`, vem `null`.

**Erros:** `401`, `404` (perfil), `500` (erro da Evolution).

**Notas:**

- A UI faz polling deste endpoint a cada 3s enquanto aguarda scan; ao
  `connected = true`, encerra.
- `zapi_token` pode ser `null` (as chamadas caem para a `EVOLUTION_API_KEY`
  global) — não bloqueia a consulta.
