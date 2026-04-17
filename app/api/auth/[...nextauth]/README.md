# app/api/auth/[...nextauth]/

Handler catch-all do NextAuth v5.

## route.ts

**O que faz:** re-exporta `GET` e `POST` de `@/auth`.

**Depende de:** [auth.ts](../../../../auth.ts)

**Notas:** não adicionar lógica aqui — toda configuração fica em `auth.ts`.
