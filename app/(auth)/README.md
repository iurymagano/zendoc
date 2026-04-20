# app/(auth)/

Route group com as páginas de autenticação (login e registro). Usa um layout
próprio centralizado com o branding do IAzen.

## layout.tsx

**O que faz:** layout split-screen (desktop) para login e cadastro.

- Lado esquerdo (`.dark`, só em `lg:`): fundo preto IAzen com gradientes
  radiais azul+violeta, [`<Logo size="lg">`](../../components/brand/README.md),
  tagline gradiente e lista de bullets de proposta de valor
- Lado direito: card com o formulário, centralizado, fundo `bg-muted/30`;
  em mobile o `<Logo>` aparece no topo como fallback

**Depende de:** `@/components/brand/Logo`.

## login/page.tsx

**O que faz:** página `'use client'` com login por credenciais (email/senha) via
`signIn('credentials', …)` e botão de login com Google (`signIn('google', …)`).

**Notas:** redireciona para `?callbackUrl=` após sucesso, ou `/dashboard` por padrão.

## register/page.tsx

**O que faz:** página `'use client'` que cria a conta via `POST /api/auth/register`,
faz login automático com as mesmas credenciais e redireciona para `/onboarding/step-1`.

**Notas:** valida senha mínima (8 chars) e confirmação de senha no cliente.
