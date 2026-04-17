# app/api/auth/

Endpoints de autenticação.

## [...nextauth]/route.ts

**O que faz:** re-exporta os handlers `GET` e `POST` configurados em `@/auth`.

**Depende de:** [auth.ts](../../../auth.ts)

## register/route.ts

**O que faz:** cria um usuário no Supabase Auth (`supabase.auth.admin.createUser`)
já com `email_confirm: true`.

**Exporta:** `POST(req): NextResponse`

**Depende de:** `@/lib/supabase`, `zod`

**Notas:** normaliza a mensagem de erro para "email já existe" quando o Supabase
retorna conflito.
