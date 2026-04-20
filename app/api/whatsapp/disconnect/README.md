# app/api/whatsapp/disconnect/

## route.ts

**Endpoint:** `POST /api/whatsapp/disconnect`

**Autenticação:** sessão NextAuth obrigatória.

**Efeito:**

1. Se `zapi_instance_id` e `zapi_token` existirem, chama `disconnectInstance()`
   na Z-API (`POST /disconnect`). Erros são logados mas não bloqueiam a
   limpeza local.
2. Marca `professionals.whatsapp_connected = false` no banco.

**Resposta 200:** `{ ok: true }`.

**Erros:** `401`, `404`.

**Notas:**

- Diferente da versão Evolution, **não apaga** a instância — Z-API mantém a
  instância provisionada. O profissional pode reconectar depois escaneando
  um novo QR sem precisar do suporte.
- Após desconectar, a IA imediatamente para de responder e o cron de
  lembretes marca lembretes pendentes como `failed` com motivo "WhatsApp não
  conectado".
