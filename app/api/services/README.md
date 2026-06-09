# app/api/services/

CRUD dos tipos de serviço do profissional (avaliação, retorno, sessão…), com
duração e preço próprios.

## route.ts

- **`GET /api/services`** — lista os serviços do profissional (ativos primeiro,
  ordenados por nome). `{ services: Service[] }`.
- **`POST /api/services`** — cria. Payload: `{ name, duration_min (5–600),
  price_cents? }`. 409 se o nome já existir.

## Subpastas

- [\[id\]/](./[id]/) — `PATCH` (nome/duração/preço/ativo) e `DELETE`.

**Notas:** `price_cents` é inteiro (centavos) ou null. Validação de dono por
`professional_id` derivado da sessão. Usado na `/agenda` (seletor de serviço →
duração automática) e na tela `/configuracoes/servicos`.
