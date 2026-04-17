# app/

Rotas do Next.js App Router — páginas e endpoints de API.

## Mapa de rotas

| Rota                     | Tipo   | Arquivo                                | Descrição                                    |
| ------------------------ | ------ | -------------------------------------- | -------------------------------------------- |
| `/`                      | página | `page.tsx`                             | Landing pública                              |
| `/login`                 | página | `(auth)/login/page.tsx`                | Formulário de login (credenciais ou Google)  |
| `/register`              | página | `(auth)/register/page.tsx`             | Criação de conta                             |
| `/onboarding`            | página | `onboarding/page.tsx`                  | Redireciona para `/onboarding/step-1`        |
| `/onboarding/step-1`     | página | `onboarding/step-1/page.tsx`           | Dados pessoais (nome + WhatsApp)             |
| `/onboarding/step-2`     | página | `onboarding/step-2/page.tsx`           | Perfil do consultório (especialidade, tom)   |
| `/dashboard`             | página | `(dashboard)/dashboard/page.tsx`       | Visão geral após login                       |
| `/api/auth/*`            | API    | `api/auth/[...nextauth]/route.ts`      | Handler do NextAuth                          |
| `/api/auth/register`     | API    | `api/auth/register/route.ts`           | POST — cria usuário no Supabase Auth         |
| `/api/onboarding/profile`| API    | `api/onboarding/profile/route.ts`      | POST — cria/atualiza `professionals`         |

## layout.tsx

**O que faz:** layout raiz com fontes Geist e metadados do Zendoc.

**Depende de:** `./globals.css`, `next/font/google`

## page.tsx

**O que faz:** landing pública com call-to-action para registro e login.

## globals.css

**O que faz:** importa Tailwind v4 e define variáveis de tema (cores e fontes).
