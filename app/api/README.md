# app/api/

API Routes do Next.js. Cada subpasta vira um endpoint REST.

## Endpoints

### `POST /api/auth/register`

Arquivo: [auth/register/route.ts](./auth/register/route.ts)

**Payload:**

```json
{ "email": "user@example.com", "password": "minimo8chars" }
```

**Resposta 200:** `{ "user_id": "uuid" }`

**Erros:** 400 (validação ou email duplicado)

### `GET/POST /api/auth/[...nextauth]`

Arquivo: [auth/[...nextauth]/route.ts](./auth/[...nextauth]/route.ts)

Handler do NextAuth v5 — expõe endpoints de `/api/auth/signin`, `/api/auth/callback`,
`/api/auth/session`, etc. Não editar manualmente.

### `POST /api/onboarding/profile`

Arquivo: [onboarding/profile/route.ts](./onboarding/profile/route.ts)

Cria ou atualiza o registro em `professionals` para o usuário logado. Define
`plan_status = 'trialing'` e `trial_ends_at = now() + 7 dias`.

**Payload:**

```json
{
  "name": "Dra. Ana",
  "phone": "5511999999999",
  "specialty": "Psicólogo(a)",
  "address": "Rua... (opcional)",
  "tone": "amigável",
  "custom_instructions": "Texto livre (opcional)"
}
```

**Autenticação:** obrigatória (NextAuth session). Retorna 401 se não logado.
