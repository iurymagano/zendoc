# app/api/whatsapp/connect/

## route.ts

**Endpoint:** `POST /api/whatsapp/connect`

**Autenticação:** sessão NextAuth obrigatória.

**Comportamento:**

- Busca `zapi_instance_id` e `zapi_token` do profissional logado.
- Se algum deles for `null` → retorna `400` com orientação de contato com o
  suporte (instância não foi provisionada).
- Caso contrário, chama `getQRCode(instanceId, token)` na Z-API e retorna o
  base64 da imagem.

**Resposta 200:** `{ qrcode: string | null }` (base64 puro sem prefixo
`data:image/png;base64,` — a UI adiciona).

**Erros:**

- `401` — sem sessão.
- `404` — perfil não encontrado.
- `400` — instância não provisionada.
- `500` — erro de rede ou resposta inesperada da Z-API.

**Notas:**

- **Não cria instância** — na Z-API, instâncias são criadas manualmente no
  painel z-api.io. Este endpoint só busca QR de instâncias já existentes.
- O endpoint `/status` também retorna o QR no mesmo payload, então a UI
  normalmente nem chama o `/connect` — o polling no `/status` já basta. Esta
  rota serve para chamadas pontuais (ex.: botão "atualizar QR").

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/zapi/client`.
