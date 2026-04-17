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

Handler do NextAuth v5 — expõe `/api/auth/signin`, `/api/auth/callback`,
`/api/auth/session`, etc. Não editar manualmente.

### `POST /api/onboarding/profile`

Arquivo: [onboarding/profile/route.ts](./onboarding/profile/route.ts)

Cria ou atualiza o registro em `professionals` para o usuário logado. Define
`plan_status = 'trialing'` e `trial_ends_at = now() + 7 dias`.

### `GET/POST /api/availability/weekly`

Arquivo: [availability/weekly/route.ts](./availability/weekly/route.ts)

CRUD da rotina semanal. `POST` faz "replace all" — substitui todos os blocos
do profissional pelo payload. Detalhes em [availability/README.md](./availability/README.md).

## Autenticação

Todas as rotas (exceto o catch-all do NextAuth) começam com
`const session = await auth()` → 401 se não autenticado. Rotas que precisam do
perfil do profissional também checam existência em `professionals` → 404 se
não encontrado.
