import { CalendarPlus } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { Bubble } from './Bubble';
import { Grad, H2, SectionLabel, WRAP } from './primitives';

const STEPS = [
  { t: '0.0s', title: 'Recebe no WhatsApp', body: 'A mensagem do cliente chega no seu número.' },
  {
    t: '0.8s',
    title: 'Confere sua agenda',
    body: 'Vê o que está livre, descontando o que já está marcado (e o Google Agenda, se você conectar).',
  },
  {
    t: '1.6s',
    title: 'Responde com o seu tom',
    body: 'Oferece os horários do jeito que você ensinou.',
  },
  {
    t: 'Pronto',
    title: 'Confirma e cria o evento',
    body: 'O atendimento entra na agenda e o cliente recebe a confirmação.',
  },
];

/** Demo ao vivo: os passos de um atendimento ao lado de um celular com a conversa. */
export function LiveDemo() {
  return (
    <section id="demo" className="scroll-mt-20 pb-24 sm:pb-32">
      <div className={WRAP}>
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <div data-reveal>
              <SectionLabel>Demo ao vivo</SectionLabel>
              <H2 className="mt-5">
                Veja ela atendendo. <Grad>Em segundos.</Grad>
              </H2>
            </div>
            <ol className="mt-10 flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  data-reveal
                  data-delay={i * 80}
                  className="flex items-start gap-4 rounded-[24px] border border-[#ffffff12] bg-[#0b0c14] p-5 sm:gap-6 sm:p-6"
                >
                  <span className="tabular w-14 shrink-0 pt-0.5 font-mono text-sm font-medium text-[#5eead4] sm:w-16">
                    {s.t}
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold tracking-[-0.02em] text-white">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-[#9a9cae]">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-[#8b8da3]">Tempos de exemplo, para mostrar a sequência.</p>
          </div>

          {/* Celular */}
          <div data-reveal className="mx-auto w-full max-w-[320px]">
            <div className="rounded-[44px] border border-[#ffffff12] bg-[#0b0c14] p-3">
              <div className="dark flex min-h-[520px] flex-col overflow-hidden rounded-[34px] bg-[#05060a]">
                <div className="flex items-center gap-3 bg-[#12151f] px-5 py-4">
                  <LogoMark size={30} title={null} />
                  <div>
                    <p className="text-sm font-semibold text-white">Sua secretária</p>
                    <p className="flex items-center gap-1.5 text-xs text-[#5eead4]">
                      <span aria-hidden className="ia-spark size-1.5 rounded-full bg-[#5eead4]" />
                      online
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-end gap-3 p-4">
                  <Bubble side="in" time="09:41">
                    Oi, tem horário quarta de manhã?
                  </Bubble>
                  <Bubble side="out" time="09:41">
                    Oi, Mariana! Quarta às 10h está livre. Posso marcar?
                  </Bubble>
                  <Bubble side="in" time="09:42">
                    Pode marcar!
                  </Bubble>
                  <Bubble side="out" time="09:42">
                    Pronto, quarta às 10h confirmado. Te aviso um dia antes.
                  </Bubble>
                  <p className="mx-auto mt-1 flex items-center gap-2 rounded-full bg-[#12151f] px-4 py-2 text-xs text-[#9a9cae]">
                    <CalendarPlus className="size-3.5 text-[#5eead4]" aria-hidden />
                    Evento criado na agenda
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-[#8b8da3]">Conversa de exemplo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
