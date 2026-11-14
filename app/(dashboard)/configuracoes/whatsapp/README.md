# app/(dashboard)/configuracoes/whatsapp/

Tela de pareamento do WhatsApp via Evolution API.

## page.tsx

**O que faz:** client component com 5 estados (`loading`, `not_provisioned`,
`waiting_scan`, `connected`, `error`) orientados pelo polling em
`GET /api/whatsapp/status`.

**Fluxo:**

1. No mount, chama `GET /api/whatsapp/status`.
2. Se `provisioned = false` → estado `not_provisioned` (botão "Conectar
   WhatsApp").
3. Se `connected = true` → estado `connected` com botão desconectar.
4. Se não conectado → estado `waiting_scan`. Exibe o QR (vindo do próprio
   payload do status) e inicia polling a cada 3s.
5. Ao detectar `connected = true` no polling → encerra polling e troca para
   `connected`.

**Estados:**

| Estado            | O que mostra                                          |
| ----------------- | ----------------------------------------------------- |
| `loading`         | "Carregando status da conexão…"                       |
| `not_provisioned` | Card "Conectar seu WhatsApp" com botão                |
| `waiting_scan`    | Imagem QR + instruções + aviso de atualização automática + botão "Cancelar" (outline) |
| `connected`       | Card verde "WhatsApp conectado" com "Desconectar"     |
| `error`           | Mensagem do erro + "Tentar novamente"                 |

**Depende de:**

- `@/components/ui/{button,card}`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/connect`
- `POST /api/whatsapp/disconnect`

**Notas:**

- A imagem do QR usa `<img src="data:image/png;base64,…">` com
  `eslint-disable @next/next/no-img-element` pontual — `next/image` não
  trabalha bem com data URLs.
- **Cancelar** (`waiting_scan`, com ou sem QR carregado) chama
  `POST /api/whatsapp/disconnect` sem confirmação (não há nada conectado a
  perder): remove a instância pendurada na Evolution, zera as colunas e volta
  para `not_provisioned`. Falha do endpoint cai no estado `error`.
- O QR vem renovado automaticamente pela Evolution a cada ciclo de polling — não
  precisa de botão "gerar novo QR".
- "Conectar WhatsApp" (`not_provisioned`) cria a instância na hora via
  `POST /api/whatsapp/connect`.
