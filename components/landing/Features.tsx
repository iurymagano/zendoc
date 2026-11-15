import { Bubble } from './Bubble';
import { Grad, H2, Panel, SectionLabel, WRAP } from './primitives';

const TIMELINE = [
  { t: '−24H', title: 'Lembrete enviado', body: 'O cliente recebe o horário no WhatsApp.' },
  { t: '−23H', title: 'Cliente responde', body: 'A resposta chega na mesma conversa.' },
  { t: '−2H', title: 'Lembrete final', body: 'Um aviso curto, perto da hora.' },
];

/** Seção 03: três cards de recursos, cada um com a sua prova. */
export function Features() {
  return (
    <section id="recursos" className="scroll-mt-20 pb-24 sm:pb-32">
      <div className={WRAP}>
        <div data-reveal>
          <SectionLabel>03 — Recursos</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            Faz o que uma secretária faz. <Grad>Sem pausa para o almoço.</Grad>
          </H2>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {/* 1. Agenda 24/7 */}
          <div data-reveal>
            <Panel className="flex h-full flex-col p-7 sm:p-8">
              <p className="tabular font-display text-6xl font-bold tracking-[-0.05em] text-white">
                03:14
              </p>
              <div className="dark mt-6 flex flex-col gap-2.5" aria-hidden>
                <Bubble side="in">Quero marcar para sexta</Bubble>
                <Bubble side="out">Sexta às 15h está livre. Marco para você?</Bubble>
              </div>
              <h3 className="mt-8 font-display text-2xl font-bold tracking-[-0.03em] text-white">
                Agenda 24/7 no WhatsApp
              </h3>
              <p className="mt-3 text-[#9a9cae]">
                O cliente escreve de madrugada, no domingo ou no feriado, e ela responde na hora.
              </p>
            </Panel>
          </div>

          {/* 2. Confirma e lembra */}
          <div data-reveal data-delay="100">
            <Panel className="flex h-full flex-col p-7 sm:p-8">
              <ol className="flex flex-col" aria-label="Linha do tempo dos lembretes">
                {TIMELINE.map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <span className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className="mt-1.5 size-3 rounded-full bg-[#5eead4]"
                      />
                      {i < TIMELINE.length - 1 && (
                        <span aria-hidden className="my-1 w-px flex-1 bg-[#ffffff22]" />
                      )}
                    </span>
                    <span className="pb-5">
                      <span className="tabular block font-mono text-sm font-medium text-[#a78bff]">
                        {s.t}
                      </span>
                      <span className="block font-medium text-white">{s.title}</span>
                      <span className="block text-sm text-[#9a9cae]">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <h3 className="mt-auto pt-3 font-display text-2xl font-bold tracking-[-0.03em] text-white">
                Confirma e lembra sem esforço
              </h3>
              <p className="mt-3 text-[#9a9cae]">
                Lembretes automáticos 24h e 2h antes de cada atendimento, sem você mandar nada.
              </p>
            </Panel>
          </div>

          {/* 3. Tom */}
          <div data-reveal data-delay="200">
            <Panel className="flex h-full flex-col p-7 sm:p-8">
              <div aria-hidden>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-white">Amigável</span>
                  <span className="text-[#8b8da3]">Formal</span>
                </div>
                <div className="relative mt-4 h-1.5 rounded-full bg-[#1c2030]">
                  <div className="absolute inset-y-0 left-0 w-[30%] rounded-full bg-[#8b5cff]" />
                  <div className="absolute left-[30%] top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                </div>
                <div className="dark mt-7 flex flex-col gap-2.5">
                  <Bubble side="out">Oi, Rafael! Quinta às 10h está livre. Posso marcar?</Bubble>
                </div>
              </div>
              <h3 className="mt-auto pt-8 font-display text-2xl font-bold tracking-[-0.03em] text-white">
                IA que fala com o seu tom
              </h3>
              <p className="mt-3 text-[#9a9cae]">
                Escolha entre amigável e formal e acrescente as instruções que só você sabe.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
