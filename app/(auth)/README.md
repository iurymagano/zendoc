# app/(auth)/

Route group com as páginas de autenticação (login e registro). Usa um layout
próprio centralizado com o branding do IAzen.

## layout.tsx

**O que faz:** layout split-screen (desktop) para login e cadastro.

- Lado esquerdo (`.dark`, só em `lg:`): Void liso com o símbolo gigante cortado pela borda
  (variante `mono`, Void 2), [`<Logo size="lg">`](../../components/brand/README.md), a promessa
  "Você atende. Ela agenda." e uma conversa curta (`Bubble`)
- Lado direito: Névoa com o formulário num card branco de raio 24, centralizado; em mobile o
  `<Logo>` aparece no topo

**Depende de:** `@/components/brand/Logo`, `@/components/landing/Bubble`.

**Notas:** sem gradiente, sem depoimento nem número de eficácia (não há como provar).

## login/page.tsx

**O que faz:** página `'use client'` com login por credenciais (email/senha) via
`signIn('credentials', …)` e botão de login com Google (`signIn('google', …)`).

**Notas:** redireciona para `?callbackUrl=` após sucesso, ou `/dashboard` por padrão. Renderiza `<VisitBeacon path="/login" />` (contador de visitas).

## register/page.tsx

**O que faz:** página `'use client'` que cria a conta via `POST /api/auth/register`,
faz login automático com as mesmas credenciais e redireciona para `/onboarding/step-1`.

**Notas:** valida senha mínima (8 chars) e confirmação de senha no cliente. Renderiza `<VisitBeacon path="/register" />` (contador de visitas).
