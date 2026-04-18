# lib/zapi/

Cliente HTTP da Evolution API (WhatsApp self-hosted, ~R$50/mês no Railway).

## client.ts

**O que faz:** funções de envio/conexão da Evolution API. Hoje só expõe
`sendWhatsAppMessage` — as funções de criação de instância e leitura de QR
code entram quando a tela de conexão do WhatsApp for implementada.

**Exporta:**

- `sendWhatsAppMessage(instanceId, to, text): Promise<void>` — envia uma
  mensagem de texto. Lança se `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` não
  estiverem configuradas ou se a API responder não-2xx.

**Envs obrigatórias:**

- `EVOLUTION_API_URL` — base da instância Railway (ex.:
  `https://zendoc-evo.railway.app`).
- `EVOLUTION_API_KEY` — api key global configurada na Evolution API.

**Notas:**

- Quem chama é responsável por tratar exceções e decidir o que fazer (reenviar,
  marcar lembrete como `failed`, etc.). O cron de lembretes já faz isso.
- Números devem ser enviados no formato `5511999999999` (sem `+`, sem traços) —
  a Evolution aceita com `@s.whatsapp.net` também, mas o formato puro é o
  padrão do resto do projeto.
