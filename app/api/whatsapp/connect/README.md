# app/api/whatsapp/connect/

## route.ts

**Endpoint:** `POST /api/whatsapp/connect`

**Autenticação:** sessão NextAuth obrigatória.

**Comportamento:**

- Se o profissional **já tem** `zapi_instance_id` → chama
  `getQRCode(instanceName, token)` e devolve o base64 atual.
- Se **não tem** → cria a instância na Evolution via
  `createInstance("iazen_<professionalId>")`, salva `instanceName` em
  `zapi_instance_id` e a apikey em `zapi_token`, e devolve o QR (do create ou,
  como garantia, buscado pelo `/instance/connect`).

**Resposta 200:** `{ qrcode: string | null }` (base64; a UI adiciona o prefixo
`data:image/png;base64,` se faltar).

**Erros:**

- `401` — sem sessão.
- `404` — perfil não encontrado.
- `500` — erro de rede / resposta inesperada da Evolution (o corpo de erro cru
  é propagado na mensagem, para debug do QR).

**Notas:**

- É aqui que acontece o **onboarding self-service** — não há mais "contate o
  suporte". Substitui o provisionamento manual de painel da Z-API.
- O `/status` também devolve o QR no polling; esta rota é o gatilho inicial de
  criação/atualização.

**Depende de:** `@/auth`, `@/lib/supabase`, `@/lib/zapi/client`
(`createInstance`, `getQRCode`).
