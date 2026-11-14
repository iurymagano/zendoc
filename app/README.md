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
| `/clientes`                             | página | `(dashboard)/clientes/page.tsx` (`/pacientes` redireciona) |
| `/clientes/[id]`                        | página | `(dashboard)/clientes/[id]/page.tsx`                       |
| `/assistente`                           | página | `(dashboard)/assistente/page.tsx`                          |
| `/agenda`                               | página | `(dashboard)/agenda/page.tsx`                              |
| `/privacidade`                          | página | `privacidade/page.tsx` (pública; ver `privacidade/README.md`) |
| `/api/auth/*`                           | API    | `api/auth/[...nextauth]/route.ts`                          |
| `/api/auth/register`                    | API    | `api/auth/register/route.ts`                               |
| `/api/onboarding/profile`               | API    | `api/onboarding/profile/route.ts`                          |
| `/api/availability/weekly`              | API    | `api/availability/weekly/route.ts`                         |
| `/api/availability/exceptions`          | API    | `api/availability/exceptions/route.ts`                     |
| `/api/availability/exceptions/[id]`     | API    | `api/availability/exceptions/[id]/route.ts`                |
| `/api/ai/test`                          | API    | `api/ai/test/route.ts`                                     |
| `/api/reminders/dispatch`               | API    | `api/reminders/dispatch/route.ts`                          |
| `/api/assistant/chat`                   | API    | `api/assistant/chat/route.ts`                              |
| `/api/assistant/messages`               | API    | `api/assistant/messages/route.ts`                          |
| `/api/assistant/reminders`              | API    | `api/assistant/reminders/route.ts`                         |
| `/api/assistant/reminders/[id]/cancel`  | API    | `api/assistant/reminders/[id]/cancel/route.ts`             |
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

**O que faz:** layout raiz com as fontes da identidade v1 (Sora para títulos, Inter
para o corpo, JetBrains Mono só para dado) via `next/font/google` e metadata do IAzen.

**Depende de:** `./globals.css`, `next/font/google`

## apple-icon.png

**O que faz:** ícone de tela de início do iOS (180x180), servido pelo Next como `apple-touch-icon`. Gerado do `icon.svg` sem o raio dos cantos.

## icon.svg

**O que faz:** favicon da marca (símbolo Ensō-balão sobre Void), servido pelo Next como ícone do site.

**Notas:** gerado da geometria em `components/brand/logo-geometry.ts`. O `apple-icon.png` (180x180, quadrado sem cantos, o iOS aplica a máscara) é o mesmo símbolo sobre Void.

## page.tsx

**O que faz:** landing pública (tipo "convencer") da identidade v1. A ideia é
"Você atende. Ela agenda.", com uma conversa de WhatsApp como prova do produto.
Texto aberto a qualquer profissional com hora marcada ("clientes", "atendimentos").

**Estrutura** (cada seção é uma afirmação com a prova ao lado):

- Hero Void (`.dark`) com o título e a conversa ([`HeroChat`](../components/landing/README.md))
- "Ela só oferece o que está livre." em Névoa, com a semana (`WeekGrid`)
- "Ninguém esquece o horário." em Void, com a linha do tempo (`ReminderTimeline`)
- "Responde do jeito que você responderia." em Névoa, com `ToneDemo` (amigável x formal)
- "E ela também organiza o seu dia." em Void, com `AssistantDemo` (Assistente pessoal)
- Preço R$297/mês em faixa Violeta, com o símbolo gigante e o CTA
- Footer Void

**Depende de:** `@/components/ui/button`, `@/components/brand/Logo`, `@/components/landing/*`.

**Notas:** os textos de exemplo (Marina, Dra. Helena, horários) são fictícios.

## globals.css

**O que faz:** importa Tailwind v4, tw-animate-css e tokens shadcn. Define os
tokens da marca (`--ia-void`, `--ia-violet`, `--ia-spark`, `--ia-mist` e derivados) e
mapeia nos tokens shadcn (`--primary`, `--muted`, etc.) para `:root` (tema claro) e
`.dark` (landing e auth). Headings usam Sora com `letter-spacing: -0.03em`; o corpo usa
Inter com `line-height: 1.6`. Também define `.tabular` e os keyframes `ia-rise` e
`ia-spark` (com alternativa para `prefers-reduced-motion`).

**Notas:** a paleta e a tipografia seguem o [DESIGN.md](../DESIGN.md). Editar os tokens
aqui propaga para todos os componentes de [components/ui/](../components/ui/).
