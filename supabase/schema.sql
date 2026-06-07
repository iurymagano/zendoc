-- IAzen — Schema completo
-- Rode no SQL Editor do Supabase (cole tudo e Run).
-- Idempotente o suficiente para um projeto novo.

-- ──────────────────────────────────────────────
-- PROFESSIONALS
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- AVAILABILITY_WEEKLY
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- AVAILABILITY_EXCEPTIONS
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- PATIENTS
-- ──────────────────────────────────────────────
create table patients (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid references professionals on delete cascade not null,
  name              text not null,
  phone             text not null,
  cpf               text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (professional_id, phone)
);
create unique index patients_professional_cpf_idx
  on patients(professional_id, cpf)
  where cpf is not null;

-- ──────────────────────────────────────────────
-- APPOINTMENTS
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- REMINDERS
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- CONVERSATION_HISTORY
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- TRIGGERS
-- ──────────────────────────────────────────────
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

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────
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
