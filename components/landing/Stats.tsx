import { Panel, WRAP } from './primitives';

const STATS = [
  { n: '24/7', l: 'atendimento no WhatsApp' },
  { n: '24h+2h', l: 'lembretes antes do horário' },
  { n: '7 dias', l: 'de teste grátis' },
  { n: 'R$0', l: 'para começar' },
];

/** Faixa de quatro números. */
export function Stats() {
  return (
    <section className="pb-24 sm:pb-32" aria-label="Em números">
      <div className={WRAP}>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {STATS.map((s, i) => (
            <li key={s.n}><Panel className="p-6 sm:p-8">
              <div data-reveal data-delay={i * 90}>
                <p className="font-display text-[2.1rem] font-bold leading-none tracking-[-0.05em] text-white sm:text-5xl">
                  {s.n}
                </p>
                <p className="mt-3 text-sm text-[#9a9cae]">{s.l}</p>
              </div>
            </Panel></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
