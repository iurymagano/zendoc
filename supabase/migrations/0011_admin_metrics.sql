-- 0011_admin_metrics — métricas de uso para o painel /admin do dono.
-- Aditiva e idempotente. As tabelas têm RLS ligado e NENHUMA policy: só a
-- service key (servidor) lê e escreve; anon/authenticated não enxergam nada.

-- Um registro por usuário por dia (America/Sao_Paulo) em que abriu o painel.
create table if not exists activity_days (
  user_id       uuid not null,
  day           date not null,
  last_seen_at  timestamptz not null default now(),
  hits          int not null default 1,
  primary key (user_id, day)
);
create index if not exists activity_days_day_idx on activity_days(day);
alter table activity_days enable row level security;

-- Contagem anônima de visitas às páginas públicas, por dia e caminho.
create table if not exists site_visits (
  day     date not null,
  path    text not null,
  visits  int not null default 0,
  primary key (day, path)
);
alter table site_visits enable row level security;

create or replace function touch_activity(p_user uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into activity_days (user_id, day, last_seen_at, hits)
  values (p_user, (now() at time zone 'America/Sao_Paulo')::date, now(), 1)
  on conflict (user_id, day)
  do update set hits = activity_days.hits + 1, last_seen_at = now();
$$;

create or replace function increment_site_visit(p_path text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into site_visits (day, path, visits)
  values ((now() at time zone 'America/Sao_Paulo')::date, p_path, 1)
  on conflict (day, path)
  do update set visits = site_visits.visits + 1;
$$;

-- Só o servidor (service_role) chama as funções.
revoke all on function touch_activity(uuid) from public, anon, authenticated;
revoke all on function increment_site_visit(text) from public, anon, authenticated;
grant execute on function touch_activity(uuid) to service_role;
grant execute on function increment_site_visit(text) to service_role;
