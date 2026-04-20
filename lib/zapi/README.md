# lib/zapi/

Cliente HTTP da **Z-API** (SaaS gerenciado em `api.z-api.io`). Cada
profissional tem sua própria instância Z-API, com `instanceId` e `token`
persistidos na tabela `professionals` (`zapi_instance_id` e `zapi_token`).

Provisionamento das instâncias é **manual** pelo painel da Z-API — o IAzen
não cria nem apaga instâncias.

## client.ts

**O que faz:** cliente tipado das rotas da Z-API que o IAzen usa (QR, status,
envio de mensagem, desconectar).

**Base URL:** `https://api.z-api.io/instances/{instanceId}/token/{token}/...`

**Exporta:**

- `sendWhatsAppMessage(instanceId, token, phone, message): Promise<void>` —
  `POST /send-text`. Lança em resposta não-2xx.
- `getQRCode(instanceId, token): Promise<string | null>` — `GET /qr-code/image`.
  Retorna o `value` (base64, sem prefixo `data:image/png;base64,`). Retorna
  `null` se a Z-API responder não-2xx (já conectado, por exemplo).
- `getConnectionStatus(instanceId, token): Promise<{ connected: boolean }>` —
  `GET /status`. Retorna `{ connected: false }` em erro.
- `disconnectInstance(instanceId, token): Promise<void>` — `POST /disconnect`.
  Tolera 404.

**Envs usadas:** nenhuma diretamente no client (instanceId/token vêm do
banco por profissional). O `ZAPI_CLIENT_TOKEN` é usado apenas na rota de
webhook para validar chamadas de entrada da Z-API.

**Notas:**

- Quando `zapi_instance_id` ou `zapi_token` estiverem `null` no banco, a UI
  direciona o profissional ao suporte — não existe fluxo self-service de
  criação de instância.
- Telefones enviados no formato `5511999999999` (sem `+`, sem traços).
- Diferente da Evolution, a Z-API não tem webhook de `qrcode.updated` nem
  `connection.update` — QR e status são sempre consultados sob demanda via
  HTTP.
