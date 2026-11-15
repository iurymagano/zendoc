import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { Setup } from '@/lib/dashboard/setup';
import { Panel } from './Panel';

function Progress({ pct }: { pct: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da configuração"
      className="h-1.5 overflow-hidden rounded-full bg-secondary"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Items({ setup }: { setup: Setup }) {
  return (
    <ol className="flex flex-col gap-2">
      {setup.items.map((item) => {
        const highlight = !item.done && item.key === 'whatsapp';
        return (
          <li
            key={item.key}
            className={`flex flex-col gap-3 rounded-[var(--radius-field)] p-4 sm:flex-row sm:items-center sm:justify-between ${
              highlight ? 'bg-[var(--ia-void)] text-white' : 'bg-background'
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                  item.done ? 'bg-[var(--success)] text-white' : highlight ? 'bg-white/15' : 'bg-secondary'
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
                  className: 'min-h-11 shrink-0 sm:min-h-8',
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
    <section
      aria-labelledby="titulo-comecar"
      className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-card p-5 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <h1
          id="titulo-comecar"
          className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.035em] [text-wrap:balance] sm:text-3xl"
        >
          Bem-vindo, {firstName}. Vamos ligar sua&nbsp;secretária.
        </h1>
        <p className="max-w-xl text-base leading-relaxed">
          Faltam {setup.total - setup.doneCount} passos para a IA começar a agendar, confirmar e
          lembrar seus clientes no WhatsApp.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-xs text-muted-foreground">
          <span>{setup.doneCount} de {setup.total}</span>
          <span className="tabular-nums">{setup.pct}%</span>
        </div>
        <Progress pct={setup.pct} />
      </div>
      <Items setup={setup} />
    </section>
  );
}

/**
 * Conta em uso, mas com configuração pela metade: card discreto com o progresso real,
 * os passos numa lista curta e o botão só do PRÓXIMO passo.
 */
export function SetupCard({ setup }: { setup: Setup }) {
  const next = setup.next;
  return (
    <Panel title="Primeiros passos" description={`${setup.doneCount} de ${setup.total} concluídos`}>
      <Progress pct={setup.pct} />
      <ol className="flex flex-col gap-1.5">
        {setup.items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className={`grid size-4 shrink-0 place-items-center rounded-full ${
                item.done ? 'bg-[var(--success)] text-white' : 'bg-secondary'
              }`}
            >
              {item.done && <Check className="size-3" />}
            </span>
            <span className={item.done ? 'text-muted-foreground line-through' : 'font-medium'}>
              <span className="sr-only">{item.done ? 'Concluído: ' : 'Pendente: '}</span>
              {item.title}
            </span>
          </li>
        ))}
      </ol>
      {next && (
        <div className="flex flex-col items-start gap-2 rounded-[var(--radius-field)] bg-background p-3">
          <p className="text-sm text-foreground/80">{next.why}</p>
          <Link
            href={next.href}
            className={buttonVariants({ size: 'sm', className: 'min-h-11 sm:min-h-8' })}
          >
            {next.cta}
          </Link>
        </div>
      )}
    </Panel>
  );
}
