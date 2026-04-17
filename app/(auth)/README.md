# app/(auth)/

Route group com as páginas de autenticação (login e registro). Usa um layout
próprio centralizado com o branding do Zendoc.

## layout.tsx

**O que faz:** layout centralizado (card sobre fundo zinc-50) para as páginas de
login e cadastro. Inclui link para home.

## login/page.tsx

**O que faz:** página `'use client'` com login por credenciais (email/senha) via
`signIn('credentials', …)` e botão de login com Google (`signIn('google', …)`).

**Notas:** redireciona para `?callbackUrl=` após sucesso, ou `/dashboard` por padrão.

## register/page.tsx

**O que faz:** página `'use client'` que cria a conta via `POST /api/auth/register`,
faz login automático com as mesmas credenciais e redireciona para `/onboarding/step-1`.

**Notas:** valida senha mínima (8 chars) e confirmação de senha no cliente.
