# app/api/whatsapp/

Endpoints de integração com a **Z-API** (SaaS). Cada profissional tem uma
instância Z-API provisionada manualmente no painel z-api.io, com credenciais
(`zapi_instance_id` e `zapi_token`) salvas em `professionals`.

## Subpastas

- [connect/](./connect/) — `POST` busca o QR Code atual da Z-API.
- [status/](./status/) — `GET` consulta estado de conexão, sincroniza
  `whatsapp_connected` e, quando desconectado, devolve o QR junto.
- [disconnect/](./disconnect/) — `POST` desconecta a instância na Z-API (não
  apaga — instâncias são gerenciadas manualmente).
- [webhook/](./webhook/) — `POST` público, autenticado por header
  `client-token`, recebe mensagens recebidas pela Z-API e roteia para a IA.

## Fluxo

1. Usuário acessa `/configuracoes/whatsapp`.
2. UI chama `GET /api/whatsapp/status`.
3. Se `provisioned = false` → UI mostra "contato suporte".
4. Se `connected = true` → UI mostra "conectado" + botão desconectar.
5. Se não conectado → UI mostra QR code (vindo do `status`) e faz polling a
   cada 3s até conectar.
6. Quando o profissional escaneia → Z-API marca `open` internamente; na
   próxima chamada de status, o IAzen detecta e marca `whatsapp_connected=true`.
7. Mensagens recebidas pela Z-API chegam no webhook → roteadas para
   `processWhatsAppMessage` → IA responde → `sendWhatsAppMessage` envia de
   volta.

## Notas

- **Webhook é público** (Z-API precisa chamá-lo sem autenticação de sessão).
  A proteção é via header `client-token` comparado com
  `process.env.ZAPI_CLIENT_TOKEN` — configurado no painel Z-API em
  Configurações → Webhooks.
- O `instanceId` alvo do webhook vem via query string
  (`?instance=…`), configurada por instância no painel Z-API (cada instância
  aponta para uma URL específica).
- Mensagens de grupos (`isGroup: true`) e ecos do próprio número
  (`fromMe: true`) são ignorados.
