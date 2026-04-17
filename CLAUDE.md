@AGENTS.md

# Zendoc — Contexto Completo do Projeto

## O que é este projeto

Zendoc é uma plataforma SaaS de gestão de consultórios para profissionais de saúde autônomos
(psicólogos, nutricionistas, fisioterapeutas). O produto oferece uma secretária virtual
inteligente via WhatsApp que agenda, confirma e gerencia consultas automaticamente.

**Proposta de valor:** "Sua secretária virtual no WhatsApp — agenda, lembra e gerencia suas consultas automaticamente."

**Público-alvo:** Profissionais de saúde autônomos sem secretária, com 10 a 40 atendimentos/semana.

**Preço:** R$197/mês com trial gratuito de 7 dias (sem cartão).

---

## Stack tecnológica

| Camada             | Tecnologia                                    | Detalhe                          |
| ------------------ | --------------------------------------------- | -------------------------------- |
| Frontend + Backend | Next.js 14 App Router + TypeScript + Tailwind | Sem servidor separado            |
| UI library         | shadcn/ui (Radix + Tailwind)                  | Instalado via CLI — não reinventar |
| Banco de dados     | Supabase (Postgres + Auth + Realtime)         | RLS em todas as tabelas          |
| Autenticação       | NextAuth.js v5                                | Email/senha + Google OAuth       |
| WhatsApp           | Evolution API (self-hosted no Railway)        | Multi-instância, ~R$50/mês       |
| IA                 | Anthropic Claude API                          | Modelo: claude-sonnet-4-20250514 |
| Pagamentos         | Stripe                                        | Assinaturas + trial + webhooks   |
| Deploy frontend    | Vercel                                        | Deploy automático via GitHub     |
| Deploy WhatsApp    | Railway                                       | Container Docker                 |

---

⚠️ REGRA OBRIGATÓRIA — README.md em toda pasta
Esta regra tem prioridade sobre qualquer outra instrução. Não existe exceção.
A regra
Cada pasta do projeto deve ter um README.md. Esse arquivo é a documentação viva daquela pasta — descreve o propósito da pasta e documenta cada arquivo dentro dela.
Toda vez que você (Claude Code) criar, alterar ou deletar qualquer arquivo:

Antes de terminar, abra o README.md da pasta onde o arquivo está
Se o README.md não existir, crie-o
Atualize a seção correspondente ao arquivo modificado
Se criou uma pasta nova, crie o README.md dela e adicione uma referência no README.md da pasta pai

Isso não é opcional. Não termina uma tarefa sem atualizar o README da pasta afetada.
O que cada README deve ter
markdown# nome-da-pasta/

Uma frase descrevendo o propósito desta pasta.

---

## nome-do-arquivo.ts

**O que faz:** uma frase.

**Exporta:**

- `nomeDaFuncao(params): Tipo` — o que faz

**Depende de:** outros arquivos do projeto que usa

**Notas:** edge cases, decisões de design, comportamentos não óbvios
Regras do README

Se uma função mudou de assinatura → atualiza no README
Se um arquivo foi deletado → remove a seção do README
Se um comportamento mudou → atualiza a descrição
Nunca documentar algo que o código não faz mais
Nunca deixar uma função pública sem entrada no README

Pastas que já devem ter README.md
zendoc/
├── README.md ← visão geral e navegação do projeto
├── CLAUDE.md ← este arquivo (contexto para Claude Code)
├── app/
│ ├── README.md ← mapa de rotas e páginas
│ ├── api/
│ │ └── README.md ← cada API Route: método, payload, resposta
│ ├── (auth)/
│ │ └── README.md ← páginas de auth e onboarding
│ └── (dashboard)/
│ └── README.md ← páginas do dashboard
├── components/
│ ├── README.md ← índice de todos os componentes
│ ├── ui/
│ │ └── README.md ← componentes genéricos
│ ├── agenda/
│ │ └── README.md ← componentes de calendário
│ └── onboarding/
│ └── README.md ← steps do onboarding
├── lib/
│ ├── README.md ← índice dos módulos
│ ├── ai/
│ │ └── README.md ← fluxo completo da IA
│ ├── zapi/
│ │ └── README.md ← integração Evolution API
│ └── availability/
│ └── README.md ← lógica de slots
└── types/
└── README.md ← todas as interfaces e tipos

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
STRIPE_PRICE_ID=price_...           # ID do produto R$197/mês

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-instancia.railway.app
EVOLUTION_API_KEY=sua-chave-aqui

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

## WhatsApp — webhook e cliente

### app/api/whatsapp/webhook/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processWhatsAppMessage } from '@/lib/ai/processor';
import { sendWhatsAppMessage } from '@/lib/zapi/client';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.fromMe) return NextResponse.json({ ok: true });

  const instanceId: string = body.instance;
  const patientPhone: string = body.data?.key?.remoteJid?.replace(
    '@s.whatsapp.net',
    '',
  );
  const message: string =
    body.data?.message?.conversation ??
    body.data?.message?.extendedTextMessage?.text;

  if (!instanceId || !patientPhone || !message)
    return NextResponse.json({ ok: true });

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('zapi_instance_id', instanceId)
    .single();

  if (!professional || !professional.ai_enabled)
    return NextResponse.json({ ok: true });
  if (!['trialing', 'active'].includes(professional.plan_status))
    return NextResponse.json({ ok: true });

  try {
    const reply = await processWhatsAppMessage(
      professional,
      patientPhone,
      message,
    );
    await sendWhatsAppMessage(instanceId, patientPhone, reply);
  } catch (err) {
    console.error('Erro ao processar mensagem WhatsApp:', err);
  }

  return NextResponse.json({ ok: true });
}
```

### lib/zapi/client.ts

```typescript
const BASE = process.env.EVOLUTION_API_URL!;
const KEY = process.env.EVOLUTION_API_KEY!;
const H = { 'Content-Type': 'application/json', apikey: KEY };

export async function sendWhatsAppMessage(
  instanceId: string,
  to: string,
  text: string,
) {
  await fetch(`${BASE}/message/sendText/${instanceId}`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ number: to, text }),
  });
}

export async function createInstance(
  instanceId: string,
): Promise<{ qrcode: string }> {
  const res = await fetch(`${BASE}/instance/create`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      instanceName: instanceId,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: `${process.env.NEXT_PUBLIC_URL}/api/whatsapp/webhook`,
        byEvents: false,
        base64: false,
        events: ['MESSAGES_UPSERT'],
      },
    }),
  });
  return res.json();
}

export async function getConnectionStatus(
  instanceId: string,
): Promise<'open' | 'close' | 'connecting'> {
  const res = await fetch(`${BASE}/instance/connectionState/${instanceId}`, {
    headers: H,
  });
  const data = await res.json();
  return data.instance?.state ?? 'close';
}

export async function getQRCode(instanceId: string): Promise<string> {
  const res = await fetch(`${BASE}/instance/connect/${instanceId}`, {
    headers: H,
  });
  const data = await res.json();
  return data.base64 ?? '';
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

### middleware.ts

```typescript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isDashboard =
    path.startsWith('/dashboard') ||
    path.startsWith('/agenda') ||
    path.startsWith('/configuracoes');
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

**WhatsApp:**

- Telefone sempre no formato `5511999999999` (sem +, sem espaços, com DDI)
- Ignorar mensagens com `fromMe: true` no webhook
- Se `ai_enabled = false` ou plano inativo → ignorar silenciosamente

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

### Sprint 1 — checklist

- [ ] Setup Next.js 14 + Tailwind + TypeScript
- [ ] Rodar schema SQL no Supabase
- [ ] auth.ts (NextAuth — email + Google)
- [ ] middleware.ts de proteção de rotas
- [ ] Tela de login
- [ ] Tela de cadastro
- [ ] Onboarding passo 1 — dados pessoais
- [ ] Onboarding passo 2 — perfil do consultório
- [ ] POST /api/onboarding/profile
- [ ] Deploy na Vercel

### Sprint 2 — checklist

- [ ] Tela de disponibilidade semanal (blocos morning/afternoon)
- [ ] Tela de exceções por data
- [ ] Deploy Evolution API no Railway
- [ ] Tela de conexão WhatsApp com QR Code (polling 30s)
- [ ] POST /api/whatsapp/webhook
- [ ] lib/ai/ completo (processor, executor, prompt-builder)
- [ ] lib/availability/slots.ts
- [ ] Cron de lembretes (Vercel Cron Jobs)

---

## Convenções de código

- TypeScript strict em todos os arquivos
- **UI: sempre shadcn/ui.** Para qualquer componente visual (botão, input, select,
  dialog, card, switch, etc.) use os componentes de `components/ui/` instalados
  via `npx shadcn@latest add <name>`. Nunca criar do zero `<button>`/`<input>`
  estilizados manualmente quando existir equivalente shadcn. Wrappers por domínio
  (ex.: `components/onboarding/`) podem compor shadcn, mas não duplicá-lo.
- Toda API Route começa com: `const session = await auth()` → retorna 401 se não autenticado
- Retornos sempre com `NextResponse.json()`
- `SUPABASE_SERVICE_KEY` apenas em API Routes (server-side)
- `SUPABASE_ANON_KEY` apenas em componentes client-side
- Datas: `timestamptz` no banco, ISO 8601 com `-03:00` no código
- Telefones: `5511999999999` (sem +, sem traços, sem espaços)
- `'use client'` apenas quando necessário (hooks, event handlers)
- Erros: `console.error(...)` + status HTTP adequado
