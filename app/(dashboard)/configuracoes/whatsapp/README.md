# app/(dashboard)/configuracoes/whatsapp/

Tela de pareamento do WhatsApp via Z-API.

## page.tsx

**O que faz:** client component com 5 estados (`loading`, `not_provisioned`,
`waiting_scan`, `connected`, `error`) orientados pelo polling em
`GET /api/whatsapp/status`.

**Fluxo:**

1. No mount, chama `GET /api/whatsapp/status`.
2. Se `provisioned = false` → estado `not_provisioned` (card âmbar com
   orientação de contatar o suporte).
3. Se `connected = true` → estado `connected` com botão desconectar.
4. Se não conectado → estado `waiting_scan`. Exibe o QR (vindo do próprio
   payload do status) e inicia polling a cada 3s.
5. Ao detectar `connected = true` no polling → encerra polling e troca para
   `connected`.

**Estados:**

| Estado            | O que mostra                                          |
| ----------------- | ----------------------------------------------------- |
| `loading`         | "Carregando status da conexão…"                       |
| `not_provisioned` | Card âmbar "Instância ainda não ativada" (suporte)    |
| `waiting_scan`    | Imagem QR + instruções + aviso de atualização automática |
| `connected`       | Card verde "WhatsApp conectado" com "Desconectar"     |
| `error`           | Mensagem do erro + "Tentar novamente"                 |

**Depende de:**

- `@/components/ui/{button,card}`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/disconnect`

**Notas:**

- A imagem do QR usa `<img src="data:image/png;base64,…">` com
  `eslint-disable @next/next/no-img-element` pontual — `next/image` não
  trabalha bem com data URLs.
- O QR vem renovado automaticamente pela Z-API a cada ciclo de polling — não
  precisa de botão "gerar novo QR".
- O fluxo de "Conectar" deixou de existir: a instância já vem provisionada
  manualmente pela equipe IAzen no painel Z-API. A UI só mostra o QR quando
  a instância está desconectada.
