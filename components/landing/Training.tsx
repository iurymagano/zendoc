import { CalendarClock, MessageCircle } from 'lucide-react';
import { Grad, H2, Panel, SectionLabel, WRAP } from './primitives';

const POINTS = [
  {
    title: 'Conte como você atende',
    body: 'Escolha entre o tom amigável e o formal e escreva o que ela precisa saber, como “peça para chegar 10 minutos antes”.',
  },
  {
    title: 'Cadastre serviços e horários',
    body: 'Serviços com duração e preço, blocos de atendimento por dia da semana e as folgas do mês.',
  },
  {
    title: 'Teste antes de ligar',
    body: 'Converse com a IA na tela Testar IA, como se fosse um cliente, e ajuste até ficar do seu jeito.',
  },
];

const CHIPS = ['Serviços', 'Horários', 'Preços', 'Regras'];

function Toggle() {
  return (
    <span aria-hidden className="flex h-6 w-11 shrink-0 items-center justify-end rounded-full bg-[#7a47f5] p-0.5">
      <span className="size-5 rounded-full bg-white" />
    </span>
  );
}

/** Seção 02: três pontos e o card "Treinar minha IA" (ilustrativo, sem interação). */
export function Training() {
  return (
    <section id="como-funciona" className="scroll-mt-20 pb-24 sm:pb-32">
      <div className={WRAP}>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <div data-reveal>
              <SectionLabel>02 — Treinamento</SectionLabel>
              <H2 className="mt-5">
                Ensine uma vez. <Grad>Ela atende para sempre.</Grad>
              </H2>
            </div>
            <ul className="mt-10 flex flex-col gap-7">
              {POINTS.map((p, i) => (
                <li key={p.title} data-reveal data-delay={i * 90} className="flex gap-5">
                  <span className="tabular mt-0.5 font-mono text-sm text-[#a78bff]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block font-display text-xl font-bold tracking-[-0.02em] text-white">
                      {p.title}
                    </span>
                    <span className="mt-2 block max-w-md text-[#9a9cae]">{p.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal aria-hidden>
            <Panel className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-bold tracking-[-0.02em] text-white">
                  Treinar minha IA
                </p>
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#5eead4]">
                  <span className="size-1.5 rounded-full bg-[#5eead4]" />
                  Ativa
                </span>
              </div>
              <p className="mt-6 text-sm font-medium text-[#9a9cae]">Instruções</p>
              <div className="mt-2 rounded-2xl bg-[#12151f] p-4 text-[15px] leading-relaxed text-white">
                Atendo de terça a sábado. Peça para chegar 10 minutos antes e, se o cliente quiser
                remarcar, ofereça os próximos horários livres.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-[#ffffff18] bg-[#12151f] px-4 py-2 text-sm text-[#c4b5fd]"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="mt-8 text-sm font-medium text-[#9a9cae]">Integrações</p>
              <div className="mt-2 flex flex-col gap-2">
                {[
                  { n: 'Google Agenda', i: CalendarClock },
                  { n: 'WhatsApp', i: MessageCircle },
                ].map(({ n, i: Icon }) => (
                  <div key={n} className="flex items-center gap-3 rounded-2xl bg-[#12151f] px-4 py-3.5">
                    <Icon className="size-5 text-[#a78bff]" />
                    <span className="flex-1 text-sm font-medium text-white">{n}</span>
                    <Toggle />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
