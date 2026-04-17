# app/api/auth/register/

Endpoint de criação de conta por email/senha.

## route.ts

**O que faz:** valida payload com Zod, cria usuário no Supabase Auth com
`email_confirm: true` para permitir login imediato.

**Exporta:** `POST(req): NextResponse`

**Depende de:** `@/lib/supabase`, `zod`

**Notas:**

- Senha mínima: 8 caracteres.
- Email duplicado → 400 com mensagem "Já existe uma conta com este email.".
- Após sucesso, o client faz `signIn('credentials', …)` para iniciar a sessão.
