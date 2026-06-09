# app/api/professionals/

Atualização parcial do perfil do profissional logado (whitelist de campos).

## route.ts

- **`GET /api/professionals`** — devolve `{ professional: { id, name, specialty,
  buffer_min } }` (nome/especialidade usados no avatar da sidebar).
- **`PATCH /api/professionals`** — atualiza campos permitidos. Hoje só
  `buffer_min` (0–240, intervalo entre atendimentos respeitado nos slots da IA).
  Extensível para outros campos de configuração.

**Depende de:** `auth`, `lib/supabase`. Filtra por `user_id` da sessão.

**Notas:** o cadastro inicial do perfil é feito em
[/api/onboarding/profile](../onboarding/profile/); este endpoint é para ajustes
pontuais pós-onboarding.
