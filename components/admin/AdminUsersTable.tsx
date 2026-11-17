'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilterBar, FilterChip } from '@/components/layout/FilterBar';
import { SearchInput } from '@/components/layout/SearchInput';
import { SectionHeader } from '@/components/layout/SectionHeader';
import type { AdminUserRow } from '@/lib/admin/types';
import { PlanBadge } from './PlanBadge';
import {
  PLAN_LABEL,
  PLAN_ORDER,
  formatDate,
  formatInt,
  planOf,
  relativeDays,
  type PlanKey,
} from './format';

type Row = AdminUserRow & { plan: PlanKey };

const PROVIDER_LABEL = { google: 'Google', email: 'E-mail' } as const;

/** Minúsculas e sem acento, para a busca não depender de digitar "á". */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function WhatsAppState({ user }: { user: Row }) {
  if (user.plan === 'no_onboarding') return <span className="text-muted-foreground">—</span>;
  return user.whatsappConnected ? (
    <span className="inline-flex items-center gap-1.5 text-status-confirmed">
      <Check aria-hidden="true" className="size-3.5" />
      Conectado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Minus aria-hidden="true" className="size-3.5" />
      Desligado
    </span>
  );
}

/** Fim do teste: só tem sentido enquanto a conta está (ou esteve) em teste. */
function trialEnd(user: Row): string | null {
  return (user.plan === 'trial' || user.plan === 'trial_expired') && user.trialEndsAt
    ? formatDate(user.trialEndsAt)
    : null;
}

function NameLines({ user }: { user: Row }) {
  return (
    <>
      <p
        className={
          user.name
            ? 'truncate font-semibold text-foreground'
            : 'truncate font-medium text-muted-foreground'
        }
      >
        {user.name ?? 'Sem onboarding'}
      </p>
      <p className="truncate text-xs text-muted-foreground sm:text-sm md:text-xs">{user.email}</p>
    </>
  );
}

function Field({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-[13px] text-foreground' : 'truncate text-foreground'}>
        {value}
      </dd>
    </div>
  );
}

export function AdminUsersTable({
  users,
  generatedAt,
}: {
  users: AdminUserRow[];
  generatedAt: string;
}) {
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState<PlanKey | 'all'>('all');

  const rows = useMemo<Row[]>(
    () => users.map((u) => ({ ...u, plan: planOf(u, generatedAt) })),
    [users, generatedAt],
  );

  const counts = useMemo(() => {
    const c = {} as Record<PlanKey, number>;
    for (const key of PLAN_ORDER) c[key] = 0;
    for (const r of rows) c[r.plan] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return rows.filter((r) => {
      if (plan !== 'all' && r.plan !== plan) return false;
      if (!q) return true;
      return normalize(`${r.name ?? ''} ${r.email}`).includes(q);
    });
  }, [rows, query, plan]);

  const filtering = query.trim() !== '' || plan !== 'all';
  const clear = () => {
    setQuery('');
    setPlan('all');
  };

  return (
    <section aria-label="Usuários" className="flex flex-col gap-3">
      <SectionHeader
        title="Usuários"
        description="Todas as contas, das mais recentes para as mais antigas."
      />
      <FilterBar
        label="Buscar e filtrar usuários"
        search={
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar por nome ou e-mail"
            label="Buscar usuário por nome ou e-mail"
            className="sm:max-w-sm"
          />
        }
        trailing={
          <span aria-live="polite" className="tabular-nums">
            {formatInt(filtered.length)} de {formatInt(rows.length)}{' '}
            {rows.length === 1 ? 'conta' : 'contas'}
          </span>
        }
      >
        <FilterChip active={plan === 'all'} onClick={() => setPlan('all')} count={rows.length}>
          Todos
        </FilterChip>
        {PLAN_ORDER.map((key) => (
          <FilterChip
            key={key}
            active={plan === key}
            onClick={() => setPlan(plan === key ? 'all' : key)}
            count={counts[key]}
          >
            {PLAN_LABEL[key]}
          </FilterChip>
        ))}
      </FilterBar>

      {filtered.length === 0 ? (
        <Card className="items-start gap-3 rounded-[var(--radius-card)] px-5 py-6 ring-0">
          <p className="text-sm text-foreground">
            {rows.length === 0
              ? 'Nenhuma conta criada ainda. Quando alguém se cadastrar, a conta aparece aqui.'
              : 'Nenhuma conta combina com a busca. Tente outro nome ou escolha outro plano.'}
          </p>
          {filtering && rows.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={clear}>
              Limpar filtros
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Celular: um cartão por conta, sem rolagem lateral. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {filtered.map((u) => {
              const end = trialEnd(u);
              return (
                <li key={u.userId}>
                  <Card className="gap-3 rounded-[var(--radius-card)] px-4 py-4 ring-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <NameLines user={u} />
                        {u.specialty && <p className="truncate text-sm text-foreground">{u.specialty}</p>}
                      </div>
                      <PlanBadge plan={u.plan} />
                    </div>
                    <dl className="grid grid-cols-3 gap-x-3 gap-y-2.5 text-sm">
                      <Field label="WhatsApp" value={<WhatsAppState user={u} />} />
                      <Field label="Último acesso" value={relativeDays(u.lastSeenAt, generatedAt)} />
                      <Field label="Atend. 30 dias" value={formatInt(u.appointments30d)} />
                      <Field label="Criada em" value={formatDate(u.createdAt)} mono />
                      <Field label="Fim do teste" value={end ?? '—'} mono={!!end} />
                      <Field label="Login" value={u.provider ? PROVIDER_LABEL[u.provider] : '—'} />
                    </dl>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Tablet e desktop: tabela; a rolagem lateral fica só dentro do cartão. */}
          <Card className="hidden min-w-0 rounded-[var(--radius-card)] px-1 py-1 ring-0 md:flex">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 z-10 bg-card pl-4">Usuário</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Fim do teste</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead className="text-right">Atend. em 30 dias</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="pr-4">Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const end = trialEnd(u);
                  return (
                    <TableRow key={u.userId} className="bg-card">
                      <TableCell className="sticky left-0 z-10 max-w-[18rem] bg-inherit pl-4">
                        <NameLines user={u} />
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate">{u.specialty ?? '—'}</TableCell>
                      <TableCell>
                        <PlanBadge plan={u.plan} />
                      </TableCell>
                      <TableCell className={end ? 'font-mono text-[13px]' : 'text-muted-foreground'}>
                        {end ?? '—'}
                      </TableCell>
                      <TableCell>
                        <WhatsAppState user={u} />
                      </TableCell>
                      <TableCell>{relativeDays(u.lastSeenAt, generatedAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatInt(u.appointments30d)}</TableCell>
                      <TableCell className="font-mono text-[13px]">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="pr-4">
                        {u.provider ? (
                          PROVIDER_LABEL[u.provider]
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </section>
  );
}
