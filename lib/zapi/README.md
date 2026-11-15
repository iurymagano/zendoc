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
global), `WEBHOOK_SECRET`, e `EVOLUTION_WEBHOOK_URL` (base que a Evolution usa
pra chamar o webhook — no dev `http://host.docker.internal:3000`; cai no
`NEXT_PUBLIC_URL` se vazia). Header de auth: `apikey` (hash da instância quando
há, senão a global).

**Exporta:**

- `createInstance(instanceName): Promise<{ instanceName, apiKey, qrcode }>` —
  `POST /instance/create` com `qrcode: true` e registro do webhook
  (`MESSAGES_UPSERT`, `CONNECTION_UPDATE`). `apiKey` é o hash da instância
  (pode vir como string ou `{ apikey }`); `qrcode` é base64 ou `null`.
- `getQRCode(instanceName, token): Promise<string | null>` —
  `GET /instance/connect/{name}`. Lê o base64 tolerando vários formatos de
  resposta. `null` em não-2xx.
- `getConnectionStatus(instanceName, token): Promise<{ connected: boolean; state?: string }>` —
  `GET /instance/connectionState/{name}`. `connected = state === 'open'`; `state`
  é o valor cru da Evolution (`open`, `close`, `connecting`).
- `sendWhatsAppMessage(instanceName, token, phone, message): Promise<void>` —
  `POST /message/sendText/{name}` com `{ number, text }`. Lança em não-2xx
  (com o corpo de erro cru do Evolution — facilita debug).
- `disconnectInstance(instanceName, token): Promise<void>` —
  `DELETE /instance/logout/{name}` + `DELETE /instance/delete/{name}`. Tolerante
  a falha: o logout de instância que nunca conectou costuma dar erro na
  Evolution, e mesmo assim o delete é sempre tentado (falha do delete é só
  logada).

**Notas:**

- Onboarding é **self-service**: a instância é criada no primeiro "Conectar".
  Não há mais fluxo de "contate o suporte".
- O QR é buscado pelo `/instance/connect` (mais confiável que ler o do
  `create`, que às vezes vem vazio) — origem do antigo erro de QR em branco.
- Telefones no formato `5511999999999` (sem `+`, sem traços).
- Risco aceito: provider não-oficial (ban de número). Migração futura para
  Cloud API oficial fica encapsulada neste módulo.

---

## connection-event.ts

**O que faz:** interpretação PURA do evento `connection.update` da Evolution (sem I/O; testada em `connection-event.test.ts`).

**Exporta:**

- `isConnectionUpdateEvent(event): boolean` — aceita `connection.update` e `CONNECTION_UPDATE`.
- `parseConnectionUpdate(body): ConnectionUpdate | null` — `{ instance, state, statusReason }`; sem instância → `null`.
- `decideConnectionAction(update, currentlyConnected): 'reconnected' | 'disconnected' | 'confirm' | 'ignore'` — `open` com o banco desconectado = `reconnected`; `close` com motivo definitivo (401 deslogado, 403, 440 sessão substituída) = `disconnected`; `close` com motivo incerto = `confirm`; já desconectado no banco ou `connecting` = `ignore`.

---

## connection-update.ts

**O que faz:** trata o `connection.update` (SERVER-ONLY): mantém `professionals.whatsapp_connected` em dia e avisa o dono no sino quando o WhatsApp cai.

**Exporta:**

- `handleConnectionUpdate(body): Promise<void>` — chamado pelo webhook (`app/api/whatsapp/webhook`).

**Depende de:** `connection-event.ts`, `client.ts` (`getConnectionStatus`), `lib/notifications/events.ts`, `lib/supabase.ts`.

**Notas:** `reconnected` volta `whatsapp_connected=true` em silêncio. `disconnected` marca e avisa na hora. `confirm` espera 5 s (o Baileys costuma reconectar sozinho) e só marca/avisa se `getConnectionStatus` ainda diz que caiu. O `update ... where whatsapp_connected = true` é o dedupe: só quem de fato virou a chave avisa, então eventos repetidos não geram avisos duplicados.
