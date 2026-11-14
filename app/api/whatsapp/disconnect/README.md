# app/api/whatsapp/disconnect/

## route.ts

**Endpoint:** `POST /api/whatsapp/disconnect`

**Autenticação:** sessão NextAuth obrigatória.

**Efeito:**

1. Se `zapi_instance_id` existir, chama `disconnectInstance()` —
   `DELETE /instance/logout` + `DELETE /instance/delete` na Evolution. Erros
   são logados mas não bloqueiam a limpeza local. O logout de instância que
   nunca conectou falha na Evolution — esperado: o delete é tentado mesmo assim.
2. Zera no banco: `whatsapp_connected = false`, `zapi_instance_id = null`,
   `zapi_token = null`.

**Resposta 200:** `{ ok: true }`.

**Erros:** `401`, `404`.

**Notas:**

- Também é o "Cancelar" do estado "Aguardando scan" em
  `/configuracoes/whatsapp` (instância criada mas nunca pareada).
- **Remove a instância** no servidor (libera o slot). Por isso as colunas são
  zeradas — o próximo "Conectar" cria uma instância nova do zero.
- Após desconectar, a IA para de responder e o cron de lembretes marca
  pendentes como `failed` com motivo "WhatsApp não conectado".

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/zapi/client`
(`disconnectInstance`).
