# app/api/conversations/[phone]/send/

## route.ts

**`POST { message }`** — envia uma mensagem manual do profissional pelo WhatsApp
(`sendWhatsAppMessage`) e grava no histórico como `assistant`. Exige
`whatsapp_connected` + `zapi_instance_id` (400 se não conectado; 502 se o envio
falhar).
