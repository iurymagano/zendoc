# lib/zapi/

Cliente HTTP da **Evolution API** (open source, self-hosted, baseada em
Baileys/QR). Um único servidor Evolution hospeda todas as instâncias — uma por
profissional, criada **via API**.

> A pasta mantém o nome `zapi` por histórico (antes era Z-API). Toda a
> integração de WhatsApp fica isolada aqui; o resto do app não conhece o
> provider. As colunas `professionals.zapi_instance_id` / `zapi_token` são
> reaproveitadas (instanceName / apikey da Evolution).

## client.ts

**O que faz:** cliente tipado das rotas da Evolution que o IAzen usa (criar
instância, QR, status, envio, desconectar).

**Envs:** `EVOLUTION_API_URL` (base do servidor), `EVOLUTION_API_KEY` (apikey
global), `WEBHOOK_SECRET` e `NEXT_PUBLIC_URL` (para montar a URL do webhook no
create). Header de auth: `apikey` (hash da instância quando há, senão a global).

**Exporta:**

- `createInstance(instanceName): Promise<{ instanceName, apiKey, qrcode }>` —
  `POST /instance/create` com `qrcode: true` e registro do webhook
  (`MESSAGES_UPSERT`, `CONNECTION_UPDATE`). `apiKey` é o hash da instância
  (pode vir como string ou `{ apikey }`); `qrcode` é base64 ou `null`.
- `getQRCode(instanceName, token): Promise<string | null>` —
  `GET /instance/connect/{name}`. Lê o base64 tolerando vários formatos de
  resposta. `null` em não-2xx.
- `getConnectionStatus(instanceName, token): Promise<{ connected: boolean }>` —
  `GET /instance/connectionState/{name}`. `connected = state === 'open'`.
- `sendWhatsAppMessage(instanceName, token, phone, message): Promise<void>` —
  `POST /message/sendText/{name}` com `{ number, text }`. Lança em não-2xx
  (com o corpo de erro cru do Evolution — facilita debug).
- `disconnectInstance(instanceName, token): Promise<void>` —
  `DELETE /instance/logout/{name}` + `DELETE /instance/delete/{name}`. Tolerante
  a falha.

**Notas:**

- Onboarding é **self-service**: a instância é criada no primeiro "Conectar".
  Não há mais fluxo de "contate o suporte".
- O QR é buscado pelo `/instance/connect` (mais confiável que ler o do
  `create`, que às vezes vem vazio) — origem do antigo erro de QR em branco.
- Telefones no formato `5511999999999` (sem `+`, sem traços).
- Risco aceito: provider não-oficial (ban de número). Migração futura para
  Cloud API oficial fica encapsulada neste módulo.
