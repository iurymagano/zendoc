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
| `/configuracoes/whatsapp`               | página | `(dashboard)/configuracoes/whatsapp/page.tsx`              |
| `/pacientes`                            | página | `(dashboard)/pacientes/page.tsx`                           |
| `/pacientes/[id]`                       | página | `(dashboard)/pacientes/[id]/page.tsx`                      |
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
| `/api/appointments/[id]`                | API    | `api/appointments/[id]/route.ts`                           |
| `/api/appointments/[id]/cancel`         | API    | `api/appointments/[id]/cancel/route.ts`                    |
| `/api/whatsapp/connect`                 | API    | `api/whatsapp/connect/route.ts`                            |
| `/api/whatsapp/status`                  | API    | `api/whatsapp/status/route.ts`                             |
| `/api/whatsapp/disconnect`              | API    | `api/whatsapp/disconnect/route.ts`                         |
| `/api/whatsapp/webhook`                 | API    | `api/whatsapp/webhook/route.ts`                            |

## layout.tsx

**O que faz:** layout raiz com as fontes IAzen (Space Grotesk para display, Inter
para body) via `next/font/google` e metadata do IAzen.

**Depende de:** `./globals.css`, `next/font/google`

## page.tsx

**O que faz:** landing pública com hero dark section (identidade IAzen):
fundo `#0A0A0F`, texto branco, acento azul `#4F6EF7` no headline e acento
violeta `#7C3AED` (`--ia-accent2`) em detalhes. Aplica `.dark` no wrapper raiz
para trocar todos os tokens shadcn para a paleta dark.

**Estrutura:**

- Gradient blobs decorativos (radiais, `z -1`) atrás do conteúdo — azul no
  topo, violeta na lateral
- Header sticky translúcido com `<Logo>` + CTAs (Entrar / Começar grátis)
- Hero com badge animado (`animate-ping` no ponto), headline em duas linhas
  — a segunda com gradiente azul→violeta em `bg-clip-text`
- Grid `0x — 0x — 0x` de 3 features com eyebrow mono, título e descrição
- Seção "Feito para" listando os nichos atendidos
- Footer com logo, copyright e linha técnica em fonte mono

**Depende de:** `@/components/ui/button`, `@/components/brand/Logo`.

## globals.css

**O que faz:** importa Tailwind v4, tw-animate-css e tokens shadcn. Define os
tokens IAzen (`--ia-black`, `--ia-accent`, etc.) e mapeia nos tokens shadcn
(`--primary`, `--muted`, etc.) em hex para `:root` e `.dark`. Headings aplicam
`font-display` (Space Grotesk) + `letter-spacing: -0.03em`; body usa
`font-body` (Inter) com `line-height: 1.6`.

**Notas:** a paleta e tipografia seguem o design system do IAzen (ver seção
"Identidade visual" em [CLAUDE.md](../CLAUDE.md)). Editar os tokens aqui
propaga para todos os componentes de [components/ui/](../components/ui/).
