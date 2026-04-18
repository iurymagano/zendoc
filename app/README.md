# app/

Rotas do Next.js App Router — páginas e endpoints de API.

## Mapa de rotas

| Rota                                    | Tipo   | Arquivo                                                    |
| --------------------------------------- | ------ | ---------------------------------------------------------- |
| `/`                                     | página | `page.tsx`                                                 |
| `/login`                                | página | `(auth)/login/page.tsx`                                    |
| `/register`                             | página | `(auth)/register/page.tsx`                                 |
| `/onboarding`                           | página | `onboarding/page.tsx` (redirect)                           |
| `/onboarding/step-1`                    | página | `onboarding/step-1/page.tsx`                               |
| `/onboarding/step-2`                    | página | `onboarding/step-2/page.tsx`                               |
| `/dashboard`                            | página | `(dashboard)/dashboard/page.tsx`                           |
| `/configuracoes/disponibilidade`        | página | `(dashboard)/configuracoes/disponibilidade/page.tsx`       |
| `/configuracoes/excecoes`               | página | `(dashboard)/configuracoes/excecoes/page.tsx`              |
| `/pacientes`                            | página | `(dashboard)/pacientes/page.tsx`                           |
| `/agenda`                               | página | `(dashboard)/agenda/page.tsx`                              |
| `/api/auth/*`                           | API    | `api/auth/[...nextauth]/route.ts`                          |
| `/api/auth/register`                    | API    | `api/auth/register/route.ts`                               |
| `/api/onboarding/profile`               | API    | `api/onboarding/profile/route.ts`                          |
| `/api/availability/weekly`              | API    | `api/availability/weekly/route.ts`                         |
| `/api/availability/exceptions`          | API    | `api/availability/exceptions/route.ts`                     |
| `/api/availability/exceptions/[id]`     | API    | `api/availability/exceptions/[id]/route.ts`                |
| `/api/ai/test`                          | API    | `api/ai/test/route.ts`                                     |
| `/api/reminders/dispatch`               | API    | `api/reminders/dispatch/route.ts`                          |
| `/api/patients`                         | API    | `api/patients/route.ts`                                    |
| `/api/patients/[id]`                    | API    | `api/patients/[id]/route.ts`                               |
| `/api/appointments`                     | API    | `api/appointments/route.ts`                                |

## layout.tsx

**O que faz:** layout raiz com fontes Geist e metadados do Zendoc.

**Depende de:** `./globals.css`, `next/font/google`

## page.tsx

**O que faz:** landing pública com call-to-action para registro e login. Usa
`buttonVariants` do shadcn aplicado a `<Link>` (não `asChild` — base-ui não
suporta).

## globals.css

**O que faz:** importa Tailwind v4, tw-animate-css e tokens shadcn. Define
variáveis de tema (`--primary`, `--muted`, etc.) em OKLCH para `:root` e `.dark`.

**Notas:** gerado/atualizado pelo `npx shadcn@latest init`. Editar os tokens
aqui propaga para todos os componentes de [components/ui/](../components/ui/).
