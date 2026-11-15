import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { DashboardData } from '@/lib/dashboard/load';
import { greeting } from '@/lib/dashboard/setup';
import { formatLongBrDate } from '@/lib/assistant/datetime';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Uma frase sobre o dia: quantos atendimentos, quantos já foram e quantos faltam. */
function summaryLine(d: DashboardData): string {
  const { today } = d;
  if (today.clientCount === 0 && today.personalCount === 0) {
    return 'Nenhum atendimento marcado para hoje.';
  }
  const parts: string[] = [];
  if (today.clientCount > 0) parts.push(plural(today.clientCount, 'atendimento', 'atendimentos'));
  if (today.personalCount > 0) {
    parts.push(plural(today.personalCount, 'compromisso pessoal', 'compromissos pessoais'));
  }
  const left = today.clientCount - today.doneCount;
  const tail =
    today.clientCount > 0
      ? today.doneCount === today.clientCount
        ? 'Todos já foram feitos.'
        : today.doneCount > 0
          ? `${today.doneCount} já ${today.doneCount === 1 ? 'foi feito' : 'foram feitos'}, ${left} ${left === 1 ? 'falta' : 'faltam'}.`
          : ''
      : '';
  return `Hoje: ${parts.join(' e ')}. ${tail}`.trim();
}

/** Cabeçalho da visão geral: saudação discreta, data, uma frase do dia e a ação principal. */
export function DashboardHeader({ data, firstName }: { data: DashboardData; firstName: string }) {
  const { now } = data;
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.035em] sm:text-3xl">
          {greeting(now)}, {firstName}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {capitalize(formatLongBrDate(now))} · {summaryLine(data)}
        </p>
      </div>
      <Link href="/agenda" className={buttonVariants({ className: 'min-h-11 sm:min-h-10' })}>
        <CalendarPlus className="size-4" aria-hidden="true" />
        Novo agendamento
      </Link>
    </header>
  );
}
