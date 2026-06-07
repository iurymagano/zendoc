# app/api/whatsapp/

Endpoints de integração com a **Evolution API** (self-hosted). Cada
profissional tem uma instância criada **via API** no primeiro "Conectar", com
`instanceName`/`apikey` salvos em `professionals` (`zapi_instance_id` /
`zapi_token`).

## Subpastas

- [connect/](./connect/) — `POST` cria a instância (se não existir) e devolve o
  QR; se já existe, só busca o QR atual.
- [status/](./status/) — `GET` consulta estado de conexão, sincroniza
  `whatsapp_connected` e, quando desconectado, devolve o QR junto.
- [disconnect/](./disconnect/) — `POST` desloga + remove a instância na
  Evolution e zera as colunas (`zapi_instance_id`/`zapi_token`).
- [webhook/](./webhook/) — `POST` público, autenticado por `?secret=`, recebe
  `messages.upsert` da Evolution e roteia para a IA.

## Fluxo

1. Usuário acessa `/configuracoes/whatsapp`.
2. UI chama `GET /api/whatsapp/status`.
3. Se `provisioned = false` → UI mostra botão "Conectar WhatsApp" →
   `POST /api/whatsapp/connect` cria a instância e devolve o QR.
4. Se `connected = true` → UI mostra "conectado" + botão desconectar.
5. Se não conectado → UI mostra o QR e faz polling no `status` a cada 3s.
6. Quando o profissional escaneia → Evolution marca `open`; no próximo poll de
   status o IAzen detecta e marca `whatsapp_connected = true`.
7. Mensagens recebidas chegam no webhook → `processWhatsAppMessage` → IA
   responde → `sendWhatsAppMessage` envia de volta.

## Notas

- **Webhook é público** (a Evolution precisa chamá-lo sem sessão). A proteção é
  o `?secret=` comparado com `process.env.WEBHOOK_SECRET`, registrado na URL do
  webhook no `POST /instance/create`.
- O `instanceName` alvo vem no corpo do evento (`body.instance`).
- Mensagens de grupo (`remoteJid` em `@g.us`) e ecos próprios
  (`data.key.fromMe`) são ignorados.
