import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { Setup } from '@/lib/dashboard/setup';
import { Panel, SectionLabel } from './Panel';

const GRADIENT = 'bg-[linear-gradient(95deg,#A78BFF_0%,#7FD8F0_55%,#5EEAD4_100%)]';

function Progress({ pct, gradient }: { pct: number; gradient: boolean }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da configuração"
      className="h-2 overflow-hidden rounded-full bg-secondary"
    >
      <div
        className={`h-full rounded-full ${gradient ? GRADIENT : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Items({ setup, compact = false }: { setup: Setup; compact?: boolean }) {
  return (
    <ol className="flex flex-col gap-2">
      {setup.items.map((item) => {
        const highlight = !item.done && item.key === 'whatsapp';
        return (
          <li
            key={item.key}
            className={`flex flex-col gap-3 rounded-2xl p-4 ${compact ? '' : 'sm:flex-row sm:items-center sm:justify-between'} ${
              highlight ? 'bg-[var(--ia-void)] text-white' : 'bg-background'
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                  item.done
                    ? 'bg-[var(--success)] text-white'
                    : highlight
                      ? 'bg-white/15'
                      : 'bg-secondary'
                }`}
              >
                {item.done && <Check className="size-3.5" />}
              </span>
              <div className="min-w-0">
                <p className={`font-medium ${item.done ? 'text-muted-foreground line-through' : ''}`}>
                  <span className="sr-only">{item.done ? 'Concluído: ' : 'Pendente: '}</span>
                  {item.title}
                </p>
                {!item.done && (
                  <p className={`text-sm ${highlight ? 'text-white/75' : 'text-muted-foreground'}`}>
                    {item.why}
                  </p>
                )}
              </div>
            </div>
            {!item.done && (
              <Link
                href={item.href}
                className={buttonVariants({
                  variant: highlight ? 'default' : 'outline',
                  size: 'sm',
                  className: `min-h-11 shrink-0 rounded-full sm:min-h-8 ${compact ? 'self-start' : ''}`,
                })}
              >
                {item.cta}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Conta nova: a tela inteira vira o passo a passo para a secretária começar a trabalhar. */
export function SetupHero({ setup, firstName }: { setup: Setup; firstName: string }) {
  return (
    <section aria-labelledby="titulo-comecar" className="flex flex-col gap-6 rounded-[32px] bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-2">
        <SectionLabel>Primeiros passos</SectionLabel>
        <h1
          id="titulo-comecar"
          className="font-display text-3xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl"
        >
          Bem-vindo, {firstName}. Vamos ligar sua secretária.
        </h1>
        <p className="max-w-xl text-base leading-relaxed">
          Faltam {setup.total - setup.doneCount} passos para a IA começar a agendar, confirmar e
          lembrar seus clientes no WhatsApp.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>{setup.doneCount} de {setup.total}</span>
          <span className="tabular-nums">{setup.pct}%</span>
        </div>
        <Progress pct={setup.pct} gradient />
      </div>
      <Items setup={setup} />
    </section>
  );
}

/** Conta em uso, mas com configuração pela metade: lista compacta ao lado do resto. */
export function SetupCard({ setup }: { setup: Setup }) {
  return (
    <Panel label="Configuração" title={`${setup.doneCount} de ${setup.total} passos`}>
      <Progress pct={setup.pct} gradient={false} />
      <Items setup={setup} compact />
    </Panel>
  );
}
