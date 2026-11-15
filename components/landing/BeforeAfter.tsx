import { Check, X } from 'lucide-react';
import { Grad, H2, Panel, SectionLabel, WRAP } from './primitives';

const SEM = [
  'Cliente esperando resposta até você sair do atendimento',
  'Horário combinado no improviso e anotado em papel',
  'Esquecimentos e faltas sem aviso',
  'Você respondendo WhatsApp à noite e no fim de semana',
];
const COM = [
  'Resposta na hora, de madrugada ou no feriado',
  'Só os horários livres da sua agenda são oferecidos',
  'Cliente lembrado 24h e 2h antes do atendimento',
  'Você abre o painel só para ver o dia',
];

function Column({ title, items, good }: { title: string; items: string[]; good?: boolean }) {
  const Icon = good ? Check : X;
  return (
    <Panel className="h-full p-7 sm:p-10">
      <p
        className={
          good
            ? 'font-display text-2xl font-bold tracking-[-0.03em]'
            : 'font-display text-2xl font-bold tracking-[-0.03em] text-[#9a9cae]'
        }
      >
        {good ? <Grad>{title}</Grad> : title}
      </p>
      <ul className="mt-8 flex flex-col gap-5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-4">
            <span
              aria-hidden
              className={
                good
                  ? 'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#5eead4]/15 text-[#5eead4]'
                  : 'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#ff7a82]/15 text-[#ff7a82]'
              }
            >
              <Icon className="size-4" strokeWidth={2.5} />
            </span>
            <span className={good ? 'text-white' : 'text-[#9a9cae]'}>
              <span className="sr-only">{good ? 'Com IAzen: ' : 'Sem IAzen: '}</span>
              {t}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Seção 05: antes e depois, em duas colunas. */
export function BeforeAfter() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className={WRAP}>
        <div data-reveal>
          <SectionLabel>05 — Antes e depois</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            O dia de quem atende, <Grad>com e sem a IAzen.</Grad>
          </H2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <div data-reveal>
            <Column title="Sem IAzen" items={SEM} />
          </div>
          <div data-reveal data-delay="120">
            <Column title="Com IAzen" items={COM} good />
          </div>
        </div>
      </div>
    </section>
  );
}
