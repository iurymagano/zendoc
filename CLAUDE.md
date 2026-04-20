# IAzen — Contexto Completo do Projeto

## O que é este projeto

IAzen é uma plataforma SaaS de gestão de consultórios para profissionais de saúde autônomos
(psicólogos, nutricionistas, fisioterapeutas). O produto oferece uma secretária virtual
inteligente via WhatsApp que agenda, confirma e gerencia consultas automaticamente.

**Proposta de valor:** "Sua secretária virtual no WhatsApp — agenda, lembra e gerencia suas consultas automaticamente."

**Público-alvo:** Profissionais de saúde autônomos sem secretária, com 10 a 40 atendimentos/semana.

**Preço:** R$297/mês com trial gratuito de 7 dias (sem cartão).

---

## Identidade visual

O design do IAzen segue uma estética **premium e técnica**, inspirada em Stripe e Vercel —
moderna, bold, confiável.

### Tokens de design

```css
/* Cores */
--iazen-black: #0a0a0f; /* fundo escuro, texto principal */
--iazen-white: #ffffff;
--iazen-accent: #4f6ef7; /* azul primário — CTAs, links, marca */
--iazen-accent2: #7c3aed; /* violeta — acento de IA, ícone */
--iazen-muted: #6b7280; /* texto secundário */
--iazen-surface: #f4f4f6; /* fundos, cards claros */
--iazen-border: #e5e7eb; /* bordas */

/* Tipografia */
--font-display:
  'Space Grotesk', sans-serif; /* headings, logo, CTAs — peso 600/700 */
--font-body: 'Inter', sans-serif; /* corpo de texto — peso 400/500 */
--font-mono: 'Fira Code', monospace; /* código, labels técnicos */
```

### Regras de uso

- **Headings e logo:** Space Grotesk 700, `letter-spacing: -0.03em`
- **Corpo de texto:** Inter 400, `line-height: 1.6`
- **Botão primário:** fundo `#4F6EF7`, texto branco, `border-radius: 8px`
- **Dark sections:** fundo `#0A0A0F`, texto branco, acento azul
- **Nunca** usar gradientes decorativos, sombras pesadas ou cores fora da paleta acima
- **shadcn/ui** é a base de todos os componentes — customizar via `className` com as cores acima

### Fontes no projeto

Adicionar no `app/layout.tsx`:

```tsx
import { Space_Grotesk, Inter } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
```

---

## Stack tecnológica

| Camada             | Tecnologia                                    | Detalhe                            |
| ------------------ | --------------------------------------------- | ---------------------------------- |
| Frontend + Backend | Next.js 14 App Router + TypeScript + Tailwind | Sem servidor separado              |
| UI library         | shadcn/ui (Radix + Tailwind)                  | Instalado via CLI — não reinventar |
| Banco de dados     | Supabase (Postgres + Auth + Realtime)         | RLS em todas as tabelas            |
| Autenticação       | NextAuth.js v5                                | Email/senha + Google OAuth         |
| WhatsApp           | Z-API (SaaS gerenciado)                       | Uma instância por cliente, ~R$69/mês |
| IA                 | Anthropic Claude API                          | Modelo: claude-sonnet-4-20250514   |
| Pagamentos         | Stripe                                        | Assinaturas + trial + webhooks     |
| Deploy frontend    | Vercel                                        | Deploy automático via GitHub       |

---

## ⚠️ REGRA OBRIGATÓRIA — README.md em toda pasta

Esta regra tem prioridade sobre qualquer outra instrução. Não existe exceção.

### A regra

Cada pasta do projeto deve ter um `README.md`. Esse arquivo é a documentação viva daquela
pasta — descreve o propósito da pasta e documenta cada arquivo dentro dela.

Toda vez que você (Claude Code) criar, alterar ou deletar qualquer arquivo:

1. **Antes de terminar**, abra o `README.md` da pasta onde o arquivo está
2. Se o `README.md` não existir, crie-o
3. Atualize a seção correspondente ao arquivo modificado
4. Se criou uma pasta nova, crie o `README.md` dela e adicione uma referência no `README.md` da pasta pai

Isso não é opcional. Não termina uma tarefa sem atualizar o README da pasta afetada.

### O que cada README deve ter

```markdown
# nome-da-pasta/

Uma frase descrevendo o propósito desta pasta.

---

## nome-do-arquivo.ts

**O que faz:** uma frase.

**Exporta:**

- `nomeDaFuncao(params): Tipo` — o que faz

**Depende de:** outros arquivos do projeto que usa

**Notas:** edge cases, decisões de design, comportamentos não óbvios
```

### Regras do README

- Se uma função mudou de assinatura → atualiza no README
- Se um arquivo foi deletado → remove a seção do README
- Se um comportamento mudou → atualiza a descrição
- Nunca documentar algo que o código não faz mais
- Nunca deixar uma função pública sem entrada no README

### Pastas que já devem ter README.md

```
iazen/
├── README.md                  ← visão geral e navegação do projeto
├── CLAUDE.md                  ← este arquivo (contexto para Claude Code)
├── TASKS.md                   ← backlog vivo por sprint (ver regra abaixo)
├── app/
│   ├── README.md              ← mapa de rotas e páginas
│   ├── api/
│   │   └── README.md          ← cada API Route: método, payload, resposta
│   ├── (auth)/
│   │   └── README.md          ← páginas de auth e onboarding
│   └── (dashboard)/
│       └── README.md          ← páginas do dashboard
├── components/
│   ├── README.md              ← índice de todos os componentes
│   ├── ui/
│   │   └── README.md          ← componentes shadcn instalados
│   ├── agenda/
│   │   └── README.md          ← componentes de calendário
│   └── onboarding/
│       └── README.md          ← steps do onboarding
├── lib/
│   ├── README.md              ← índice dos módulos
│   ├── ai/
│   │   └── README.md          ← fluxo completo da IA
│   ├── zapi/
│   │   └── README.md          ← integração Evolution API
│   └── availability/
│       └── README.md          ← lógica de slots
└── types/
    └── README.md              ← todas as interfaces e tipos
```

---

## ⚠️ REGRA OBRIGATÓRIA — TASKS.md como fonte da verdade do backlog

Esta regra tem prioridade igual à do README. Não existe exceção.

### A regra

O arquivo `TASKS.md` na raiz do projeto é o backlog vivo do IAzen. Ele lista todas as
tarefas de cada sprint em formato de checklist (`- [ ]` / `- [x]`) e é a ÚNICA fonte da
verdade do que está feito e do que falta.

Toda vez que você (Claude Code):

1. **Terminar uma tarefa** → marque a linha correspondente em `TASKS.md` como `- [x]` antes de encerrar a resposta
2. **Descobrir uma nova tarefa ou subtarefa necessária** → adicione em `TASKS.md` no sprint correto como `- [ ]`
3. **Remover/cancelar uma tarefa** → delete a linha (não deixe `[ ]` de tarefa morta)
4. **Ao abrir uma sessão nova** → leia `TASKS.md` antes de decidir por onde continuar, para retomar exatamente de onde pararam

Isso não é opcional. Se você codou algo listado em `TASKS.md`, marque o checkbox no mesmo
commit. Nunca termine uma sessão com `TASKS.md` desatualizado.

### Formato

```markdown
## Sprint N — nome do sprint

- [x] tarefa concluída
- [ ] tarefa pendente
  - [ ] subtarefa
```

Ao marcar uma tarefa, não remova nem reescreva o texto — só troque `[ ]` por `[x]`.
Isso preserva o histórico legível via `git log`.

---

## Variáveis de ambiente

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...         # nunca expor no frontend

# NextAuth
NEXTAUTH_SECRET=                    # gerar: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...           # ID do produto R$297/mês

# Z-API (WhatsApp)
ZAPI_CLIENT_TOKEN=                  # token fixo do cliente Z-API, enviado no header `client-token` do webhook

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## Banco de dados — Schema SQL completo

```sql
-- PROFESSIONALS
create table professionals (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users on delete cascade not null,
  name                   text not null,
  specialty              text,
  phone                  text,
  address                text,
  tone                   text not null default 'amigável',
  custom_instructions    text,
  ai_enabled             boolean not null default true,
  requires_approval      boolean not null default false,
  whatsapp_connected     boolean not null default false,
  zapi_instance_id       text unique,
  zapi_token             text,
  pending_qrcode         text,
  pending_qrcode_at      timestamptz,
  plan_status            text not null default 'trialing',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  trial_ends_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create unique index professionals_user_id_idx on professionals(user_id);

-- AVAILABILITY_WEEKLY
create table availability_weekly (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  weekday           int not null check (weekday between 0 and 6),
  block_type        text not null check (block_type in ('morning','lunch','afternoon')),
  start_time        time not null,
  end_time          time not null,
  slot_duration     int not null default 50,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (professional_id, weekday, block_type),
  constraint valid_time_range check (end_time > start_time)
);

-- AVAILABILITY_EXCEPTIONS
create table availability_exceptions (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  date              date not null,
  type              text not null check (type in ('day_off','custom_hours','extra_day')),
  start_time        time,
  end_time          time,
  slot_duration     int,
  note              text,
  created_at        timestamptz not null default now(),
  unique (professional_id, date),
  constraint valid_custom_times check (
    type = 'day_off'
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

-- PATIENTS
create table patients (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  name              text not null,
  phone             text not null,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (professional_id, phone)
);

-- APPOINTMENTS
create table appointments (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  patient_id        uuid references patients on delete set null,
  patient_name      text not null,
  patient_phone     text not null,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null default 'scheduled' check (
                      status in ('scheduled','confirmed','pending_approval','cancelled','no_show')
                    ),
  booked_via        text not null default 'whatsapp_ai' check (
                      booked_via in ('whatsapp_ai','manual')
                    ),
  cancelled_by      text check (cancelled_by in ('patient','professional')),
  cancellation_note text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint valid_appointment_time check (ends_at > starts_at)
);
create index appointments_professional_time_idx
  on appointments(professional_id, starts_at, ends_at)
  where status not in ('cancelled','no_show');

-- REMINDERS
create table reminders (
  id                uuid primary key default gen_random_uuid(),
  appointment_id    uuid references appointments on delete cascade not null,
  professional_id   uuid references professionals on delete cascade not null,
  type              text not null check (type in ('24h','2h')),
  scheduled_for     timestamptz not null,
  status            text not null default 'pending' check (
                      status in ('pending','sent','failed','cancelled')
                    ),
  sent_at           timestamptz,
  error_message     text,
  created_at        timestamptz not null default now(),
  unique (appointment_id, type)
);
create index reminders_scheduled_idx
  on reminders(scheduled_for)
  where status = 'pending';

-- CONVERSATION_HISTORY
create table conversation_history (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  patient_phone     text not null,
  role              text not null check (role in ('user','assistant')),
  content           text not null,
  created_at        timestamptz not null default now()
);
create index conversation_history_lookup_idx
  on conversation_history(professional_id, patient_phone, created_at desc);

-- TRIGGERS
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger professionals_updated_at
  before update on professionals for each row execute function set_updated_at();
create trigger patients_updated_at
  before update on patients for each row execute function set_updated_at();
create trigger appointments_updated_at
  before update on appointments for each row execute function set_updated_at();

create or replace function create_appointment_reminders()
returns trigger as $$
begin
  if new.status in ('scheduled','confirmed') then
    insert into reminders (appointment_id, professional_id, type, scheduled_for)
    values
      (new.id, new.professional_id, '24h', new.starts_at - interval '24 hours'),
      (new.id, new.professional_id, '2h',  new.starts_at - interval '2 hours')
    on conflict (appointment_id, type) do nothing;
  end if;
  if new.status in ('cancelled','no_show') then
    update reminders set status = 'cancelled'
    where appointment_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger appointments_create_reminders
  after insert or update of status on appointments
  for each row execute function create_appointment_reminders();

-- RLS
alter table professionals           enable row level security;
alter table availability_weekly     enable row level security;
alter table availability_exceptions enable row level security;
alter table patients                enable row level security;
alter table appointments            enable row level security;
alter table reminders               enable row level security;
alter table conversation_history    enable row level security;

create or replace function my_professional_id()
returns uuid as $$
  select id from professionals where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

create policy "professionals: own row"
  on professionals for all using (user_id = auth.uid());
create policy "availability_weekly: own data"
  on availability_weekly for all using (professional_id = my_professional_id());
create policy "availability_exceptions: own data"
  on availability_exceptions for all using (professional_id = my_professional_id());
create policy "patients: own data"
  on patients for all using (professional_id = my_professional_id());
create policy "appointments: own data"
  on appointments for all using (professional_id = my_professional_id());
create policy "reminders: own data"
  on reminders for all using (professional_id = my_professional_id());
create policy "conversation_history: own data"
  on conversation_history for all using (professional_id = my_professional_id());
```

---

## Tipos TypeScript (types/database.ts)

```typescript
export type PlanStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'pending_approval'
  | 'cancelled'
  | 'no_show';
export type BookedVia = 'whatsapp_ai' | 'manual';
export type BlockType = 'morning' | 'lunch' | 'afternoon';
export type ExceptionType = 'day_off' | 'custom_hours' | 'extra_day';
export type ReminderType = '24h' | '2h';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type ConversationRole = 'user' | 'assistant';
export type AIAction =
  | 'book'
  | 'cancel'
  | 'reschedule'
  | 'offer_slots'
  | 'reply'
  | 'approval_needed';

export interface Professional {
  id: string;
  user_id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  address: string | null;
  tone: 'amigável' | 'formal';
  custom_instructions: string | null;
  ai_enabled: boolean;
  requires_approval: boolean;
  whatsapp_connected: boolean;
  zapi_instance_id: string | null;
  zapi_token: string | null;
  plan_status: PlanStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  professional_id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  booked_via: BookedVia;
  cancelled_by: 'patient' | 'professional' | null;
  cancellation_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityWeekly {
  id: string;
  professional_id: string;
  weekday: number; // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sáb
  block_type: BlockType;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilityException {
  id: string;
  professional_id: string;
  date: string;
  type: ExceptionType;
  start_time: string | null;
  end_time: string | null;
  slot_duration: number | null;
  note: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  professional_id: string;
  name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  appointment_id: string;
  professional_id: string;
  type: ReminderType;
  scheduled_for: string;
  status: ReminderStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  professional_id: string;
  patient_phone: string;
  role: ConversationRole;
  content: string;
  created_at: string;
}

// Resposta esperada da Claude API — sempre JSON puro
export interface AIResponse {
  action: AIAction;
  message_to_patient: string;
  booking?: {
    starts_at: string; // ISO 8601 com timezone ex: "2025-05-10T10:00:00-03:00"
    ends_at: string;
  };
  cancel?: {
    appointment_id: string;
  };
  slots?: string[];
}
```

---

## Clientes Supabase (lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

// Server-side — API Routes — usa service key, bypassa RLS
export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

// Client-side — componentes React — usa anon key, respeita RLS
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

---

## IA — arquivos completos

### lib/ai/prompt-builder.ts

```typescript
import type { Professional } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function buildSystemPrompt(
  professional: Professional,
  availableSlots: Date[],
): string {
  const slotList = availableSlots
    .map((s) => format(s, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR }))
    .join('\n');

  const tone =
    professional.tone === 'formal'
      ? 'Use linguagem formal e objetiva.'
      : 'Use linguagem amigável e acolhedora.';

  return `Você é a secretária virtual do consultório de ${professional.name}${professional.specialty ? `, ${professional.specialty}` : ''}.
Nunca se apresente como IA — você é a secretária do consultório.
${tone}
${professional.address ? `Endereço: ${professional.address}` : ''}
${professional.custom_instructions ? `Instruções especiais: ${professional.custom_instructions}` : ''}

Horários disponíveis (próximos 14 dias):
${slotList || 'Nenhum horário disponível no momento.'}

REGRAS:
- Só ofereça horários da lista acima. Nunca invente horários.
- Responda em no máximo 3 frases.
- Para cancelamentos, só cancele consultas futuras.

RESPONDA SEMPRE com JSON puro e válido, sem markdown:
{
  "action": "book" | "cancel" | "reschedule" | "offer_slots" | "reply" | "approval_needed",
  "message_to_patient": "mensagem para o paciente",
  "booking": { "starts_at": "ISO8601-03:00", "ends_at": "ISO8601-03:00" },
  "cancel": { "appointment_id": "uuid" }
}`;
}
```

### lib/ai/processor.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './prompt-builder';
import { executeAction } from './executor';
import { createServerClient } from '@/lib/supabase';
import { getAvailableSlots } from '@/lib/availability/slots';
import type { Professional, AIResponse } from '@/types/database';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function processWhatsAppMessage(
  professional: Professional,
  patientPhone: string,
  patientMessage: string,
): Promise<string> {
  const supabase = createServerClient();

  const { data: history } = await supabase
    .from('conversation_history')
    .select('role, content')
    .eq('professional_id', professional.id)
    .eq('patient_phone', patientPhone)
    .order('created_at', { ascending: false })
    .limit(10);

  const messages = (history ?? []).reverse();
  const slots = await getAvailableSlots(professional.id, 14);
  const systemPrompt = buildSystemPrompt(professional, slots);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: patientMessage },
    ],
  });

  const rawText =
    response.content[0].type === 'text' ? response.content[0].text : '';

  let aiResponse: AIResponse;
  try {
    aiResponse = JSON.parse(rawText);
  } catch {
    aiResponse = {
      action: 'reply',
      message_to_patient: 'Desculpe, não entendi. Pode reformular?',
    };
  }

  await executeAction(professional, patientPhone, aiResponse);

  await supabase.from('conversation_history').insert([
    {
      professional_id: professional.id,
      patient_phone: patientPhone,
      role: 'user',
      content: patientMessage,
    },
    {
      professional_id: professional.id,
      patient_phone: patientPhone,
      role: 'assistant',
      content: aiResponse.message_to_patient,
    },
  ]);

  return aiResponse.message_to_patient;
}
```

### lib/ai/executor.ts

```typescript
import { createServerClient } from '@/lib/supabase';
import type { Professional, AIResponse } from '@/types/database';

export async function executeAction(
  professional: Professional,
  patientPhone: string,
  response: AIResponse,
): Promise<void> {
  const supabase = createServerClient();

  if (response.action === 'book' && response.booking) {
    const { data: patient } = await supabase
      .from('patients')
      .upsert(
        {
          professional_id: professional.id,
          phone: patientPhone,
          name: 'Paciente',
        },
        { onConflict: 'professional_id,phone' },
      )
      .select()
      .single();

    const status = professional.requires_approval
      ? 'pending_approval'
      : 'scheduled';

    await supabase.from('appointments').insert({
      professional_id: professional.id,
      patient_id: patient?.id ?? null,
      patient_name: patient?.name ?? 'Paciente',
      patient_phone: patientPhone,
      starts_at: response.booking.starts_at,
      ends_at: response.booking.ends_at,
      status,
      booked_via: 'whatsapp_ai',
    });
  }

  if (response.action === 'cancel' && response.cancel) {
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', response.cancel.appointment_id)
      .eq('professional_id', professional.id);
  }

  if (response.action === 'reschedule' && response.cancel && response.booking) {
    await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'patient' })
      .eq('id', response.cancel.appointment_id);
    await executeAction(professional, patientPhone, {
      ...response,
      action: 'book',
    });
  }
}
```

---

## Integração WhatsApp — Z-API

O IAzen usa a **Z-API** (SaaS em `api.z-api.io`) como provedor de WhatsApp.
Cada profissional tem sua própria instância Z-API, gerenciada por nós
(admins), não pelo profissional.

**Modelo operacional:**

- Instâncias criadas manualmente no painel `z-api.io` pela equipe IAzen.
- `instanceId` e `token` salvos na tabela `professionals` (campos
  `zapi_instance_id` e `zapi_token`).
- O profissional nunca acessa a Z-API — tudo acontece dentro do IAzen.
- O QR Code é exibido diretamente na tela `/configuracoes/whatsapp`.

**Credenciais por profissional (tabela `professionals`):**

- `zapi_instance_id` → Instance ID da Z-API (ex.: `3F1F16CF3A3011713AE6BA4D31290A14`)
- `zapi_token` → Token daquela instância (ex.: `CB90B72324299A97CB94BA0A`)

**Base URL:** `https://api.z-api.io`

**Endpoints Z-API usados:**

| Ação               | Método | URL                                                          |
| ------------------ | ------ | ------------------------------------------------------------ |
| Buscar QR Code     | GET    | `/instances/{instanceId}/token/{token}/qr-code/image`        |
| Status da conexão  | GET    | `/instances/{instanceId}/token/{token}/status`               |
| Enviar mensagem    | POST   | `/instances/{instanceId}/token/{token}/send-text`            |
| Desconectar        | POST   | `/instances/{instanceId}/token/{token}/disconnect`           |

**Formato de envio de mensagem:**

```json
{ "phone": "5511999999999", "message": "texto da mensagem" }
```

**Formato do webhook recebido (mensagem do paciente):**

```json
{
  "phone": "5511999999999",
  "text": { "message": "texto da mensagem" },
  "fromMe": false,
  "isGroup": false
}
```

**Segurança do webhook:**

- Z-API envia o header `client-token` em todo webhook.
- Validar esse header contra `process.env.ZAPI_CLIENT_TOKEN` antes de
  processar qualquer evento. Sem match → 401.
- Valor configurado no painel Z-API e armazenado em `ZAPI_CLIENT_TOKEN`.
- O `instanceId` alvo vem pela URL configurada por instância no painel
  (ex.: `https://app.iazen.com.br/api/whatsapp/webhook?instance={INSTANCE_ID}`).

### app/api/whatsapp/webhook/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import { sendWhatsAppMessage } from '@/lib/zapi/client';
import type { Professional } from '@/types/database';

export async function POST(req: NextRequest) {
  // 1. Valida o token fixo enviado pela Z-API em todo webhook
  const clientToken = req.headers.get('client-token');
  if (clientToken !== process.env.ZAPI_CLIENT_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || body.fromMe || body.isGroup) {
    return NextResponse.json({ ok: true });
  }

  // 2. instanceId vem na URL configurada no painel Z-API (uma por instância)
  const instanceId = req.nextUrl.searchParams.get('instance');
  const patientPhone: string | undefined = body.phone;
  const message: string | undefined = body.text?.message;

  if (!instanceId || !patientPhone || !message) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('zapi_instance_id', instanceId)
    .maybeSingle<Professional>();

  if (!professional || !professional.ai_enabled) {
    return NextResponse.json({ ok: true });
  }
  if (!['trialing', 'active'].includes(professional.plan_status)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const reply = await processWhatsAppMessage(
      professional,
      patientPhone,
      message,
    );
    await sendWhatsAppMessage(
      professional.zapi_instance_id!,
      professional.zapi_token!,
      patientPhone,
      reply,
    );
  } catch (err) {
    console.error('Erro ao processar mensagem WhatsApp:', err);
  }

  return NextResponse.json({ ok: true });
}
```

### lib/zapi/client.ts

```typescript
const BASE = 'https://api.z-api.io';

function url(instanceId: string, token: string, path: string): string {
  return `${BASE}/instances/${instanceId}/token/${token}${path}`;
}

async function ensureOk(res: Response): Promise<unknown> {
  if (res.ok) return res.json().catch(() => ({}));
  const body = await res.text().catch(() => '');
  throw new Error(`Z-API ${res.status}: ${body.slice(0, 200) || 'sem corpo'}`);
}

export async function sendWhatsAppMessage(
  instanceId: string,
  token: string,
  phone: string,
  message: string,
): Promise<void> {
  const res = await fetch(url(instanceId, token, '/send-text'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message }),
  });
  await ensureOk(res);
}

export async function getQRCode(
  instanceId: string,
  token: string,
): Promise<string | null> {
  const res = await fetch(url(instanceId, token, '/qr-code/image'));
  if (!res.ok) return null;
  const data = (await res.json()) as { value?: string };
  return data.value ?? null; // base64 puro (sem prefixo data:)
}

export async function getConnectionStatus(
  instanceId: string,
  token: string,
): Promise<{ connected: boolean }> {
  const res = await fetch(url(instanceId, token, '/status'));
  if (!res.ok) return { connected: false };
  const data = (await res.json()) as { connected?: boolean };
  return { connected: !!data.connected };
}

export async function disconnectInstance(
  instanceId: string,
  token: string,
): Promise<void> {
  await fetch(url(instanceId, token, '/disconnect'), { method: 'POST' });
}
```

---

## Cálculo de slots (lib/availability/slots.ts)

```typescript
import { createServerClient } from '@/lib/supabase';
import {
  addDays,
  setHours,
  setMinutes,
  addMinutes,
  isBefore,
  startOfDay,
  format,
} from 'date-fns';

export async function getAvailableSlots(
  professionalId: string,
  days = 14,
): Promise<Date[]> {
  const supabase = createServerClient();
  const today = new Date();
  const slots: Date[] = [];

  const { data: weekly } = await supabase
    .from('availability_weekly')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .neq('block_type', 'lunch');

  const endDate = format(addDays(today, days), 'yyyy-MM-dd');
  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('date', format(today, 'yyyy-MM-dd'))
    .lte('date', endDate);

  const { data: existing } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('professional_id', professionalId)
    .gte('starts_at', today.toISOString())
    .in('status', ['scheduled', 'confirmed', 'pending_approval']);

  for (let i = 1; i <= days; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const weekday = date.getDay();
    const exception = exceptions?.find((e) => e.date === dateStr);

    if (exception?.type === 'day_off') continue;

    let blocks: Array<{ start: string; end: string; duration: number }> = [];

    if (exception?.type === 'custom_hours' || exception?.type === 'extra_day') {
      blocks = [
        {
          start: exception.start_time!,
          end: exception.end_time!,
          duration: exception.slot_duration ?? 50,
        },
      ];
    } else {
      blocks = (weekly ?? [])
        .filter((w) => w.weekday === weekday)
        .map((w) => ({
          start: w.start_time,
          end: w.end_time,
          duration: w.slot_duration,
        }));
    }

    for (const block of blocks) {
      const [sh, sm] = block.start.split(':').map(Number);
      const [eh, em] = block.end.split(':').map(Number);
      let slot = setMinutes(setHours(startOfDay(date), sh), sm);
      const blockEnd = setMinutes(setHours(startOfDay(date), eh), em);

      while (
        isBefore(addMinutes(slot, block.duration), blockEnd) ||
        addMinutes(slot, block.duration).getTime() === blockEnd.getTime()
      ) {
        const slotEnd = addMinutes(slot, block.duration);
        const hasConflict = (existing ?? []).some((a) => {
          const s = new Date(a.starts_at),
            e = new Date(a.ends_at);
          return slot < e && slotEnd > s;
        });
        if (!hasConflict && slot > today) slots.push(new Date(slot));
        slot = addMinutes(slot, block.duration);
      }
    }
  }

  return slots;
}
```

---

## Autenticação e middleware

### auth.ts

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });
        if (error || !data.user) return null;
        return { id: data.user.id, email: data.user.email! };
      },
    }),
  ],
  pages: { signIn: '/login', newUser: '/onboarding' },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
```

### proxy.ts

> **Nota (Next 16):** a convenção `middleware.ts` foi renomeada para
> `proxy.ts` — o arquivo fica na raiz do projeto e o comportamento é
> idêntico. Ver [migração oficial](https://nextjs.org/docs/messages/middleware-to-proxy).

```typescript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isDashboard =
    path.startsWith('/dashboard') ||
    path.startsWith('/agenda') ||
    path.startsWith('/pacientes') ||
    path.startsWith('/configuracoes') ||
    path.startsWith('/onboarding');
  const isAuth = path.startsWith('/login') || path.startsWith('/register');

  if (isDashboard && !isLoggedIn)
    return NextResponse.redirect(new URL('/login', req.url));
  if (isAuth && isLoggedIn)
    return NextResponse.redirect(new URL('/dashboard', req.url));
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Pagamentos Stripe

### app/api/billing/checkout/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('stripe_customer_id, name')
    .eq('user_id', session.user.id)
    .single();

  let customerId = professional?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: professional?.name,
    });
    customerId = customer.id;
    await supabase
      .from('professionals')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', session.user.id);
  }

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  });

  return NextResponse.json({ url: checkout.url });
}
```

### app/api/webhooks/stripe/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
  }

  const supabase = createServerClient();
  const update = (customerId: string, data: object) =>
    supabase
      .from('professionals')
      .update(data)
      .eq('stripe_customer_id', customerId);

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.CheckoutSession;
      await update(s.customer as string, {
        plan_status: 'active',
        stripe_subscription_id: s.subscription,
        ai_enabled: true,
      });
      break;
    }
    case 'invoice.paid':
      await update((event.data.object as Stripe.Invoice).customer as string, {
        plan_status: 'active',
        ai_enabled: true,
      });
      break;
    case 'invoice.payment_failed':
      await update((event.data.object as Stripe.Invoice).customer as string, {
        plan_status: 'past_due',
        ai_enabled: false,
      });
      break;
    case 'customer.subscription.deleted':
      await update(
        (event.data.object as Stripe.Subscription).customer as string,
        { plan_status: 'cancelled', ai_enabled: false },
      );
      break;
  }
  return NextResponse.json({ received: true });
}
```

---

## Regras de negócio

**Disponibilidade:**

- `lunch` nunca é oferecido — filtrado em `getAvailableSlots`
- Exceção tem prioridade sobre rotina semanal
- Slots calculados sempre descontando agendamentos existentes (scheduled, confirmed, pending_approval)
- Janela padrão: próximos 14 dias a partir de amanhã

**IA:**

- Retorna sempre JSON puro — sem markdown, sem texto fora do JSON
- Se parse falhar → fallback para `action: reply` com mensagem genérica
- Histórico limitado a 10 mensagens para controlar custo (~R$2,70/cliente/mês)

**Plano:**

- `trialing` e `active` → IA habilitada
- `past_due` → IA pausada, dados preservados, banner no dashboard
- `cancelled` → IA desativada, dados mantidos por 30 dias

**WhatsApp (Z-API):**

- Telefone sempre no formato `5511999999999` (sem +, sem espaços, com DDI).
- Ignorar mensagens com `fromMe: true` ou `isGroup: true` no webhook.
- Validar header `client-token == ZAPI_CLIENT_TOKEN` em toda chamada ao webhook.
- `instanceId` no webhook vem pela URL (`?instance=…`), configurada por
  instância no painel Z-API.
- Se `ai_enabled = false` ou plano inativo → ignorar silenciosamente.
- Instância é criada manualmente no painel Z-API; `zapi_instance_id` e
  `zapi_token` são salvos no banco depois que o profissional é ativado.
- Se `zapi_instance_id` for `null` → UI orienta contatar suporte (não há
  fluxo self-service de criação de instância).

**Precificação e margem:**

- Preço ao profissional: **R$297/mês** (inclui a instância Z-API embutida).
- Custo Z-API: ~R$69/mês por cliente.
- Outros custos (Supabase, Vercel, Anthropic): ~R$12/mês por cliente.
- Margem bruta aproximada: **~72%**.

---

## Sprint atual

| Sprint                   | Semanas | Status           |
| ------------------------ | ------- | ---------------- |
| 0 — Validação            | 1-2     | Concluído        |
| **1 — Fundação técnica** | 3-4     | **Em andamento** |
| 2 — Core do produto      | 5-6     | Pendente         |
| 3 — Beta                 | 7-8     | Pendente         |
| 4 — Pagamentos           | 9-10    | Pendente         |
| 5 — Crescimento          | 11-12   | Pendente         |

O checklist detalhado de cada sprint fica em [TASKS.md](TASKS.md).

---

## Convenções de código

- TypeScript strict em todos os arquivos
- **UI: sempre shadcn/ui.** Para qualquer componente visual (botão, input, select,
  dialog, card, switch, etc.) use os componentes de `components/ui/` instalados
  via `npx shadcn@latest add <nome>`. Nunca criar do zero `<button>`/`<input>`
  estilizados manualmente quando existir equivalente shadcn. Wrappers por domínio
  (ex.: `components/onboarding/`) podem compor shadcn, mas não duplicá-lo.
- **Design system IAzen:** ao estilizar componentes shadcn, usar os tokens de cor e
  tipografia definidos na seção "Identidade visual" deste arquivo. Fundo escuro `#0A0A0F`,
  acento `#4F6EF7`, display font Space Grotesk, body font Inter.
- Toda API Route começa com: `const session = await auth()` → retorna 401 se não autenticado
- Retornos sempre com `NextResponse.json()`
- `SUPABASE_SERVICE_KEY` apenas em API Routes (server-side)
- `SUPABASE_ANON_KEY` apenas em componentes client-side
- Datas: `timestamptz` no banco, ISO 8601 com `-03:00` no código
- Telefones: `5511999999999` (sem +, sem traços, sem espaços)
- `'use client'` apenas quando necessário (hooks, event handlers)
- Erros: `console.error(...)` + status HTTP adequado
