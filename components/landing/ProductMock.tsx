import { CalendarCheck, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bubble } from './Bubble';
import { Grad, H2, Panel, SectionLabel, WRAP } from './primitives';

const CONVERSAS = [
  { nome: 'Mariana', msg: 'Quarta às 10h, combinado!', hora: 'agora', ativa: true },
  { nome: 'Rafael', msg: 'Obrigado, até sexta!', hora: '09:12' },
  { nome: 'Camila', msg: 'Preciso remarcar o horário', hora: '08:40' },
  { nome: 'Diego', msg: 'Confirmo amanhã às 15h', hora: 'ontem' },
];

const AGENDA = [
  { hora: '09:00', nome: 'Rafael', info: 'Atendimento · 50 min' },
  { hora: '10:00', nome: 'Mariana', info: 'Novo · agendado pela IA', novo: true },
  { hora: '11:30', nome: 'Camila', info: 'Atendimento · 50 min' },
  { hora: '15:00', nome: 'Diego', info: 'Confirmado' },
];

/** Seção 01: o painel numa janela inclinada em 3D, com dois cards flutuando. */
export function ProductMock() {
  return (
    <section id="produto" className="scroll-mt-20 overflow-x-clip py-24 sm:py-32">
      <div className={WRAP}>
        <div data-reveal>
          <SectionLabel>01 — O produto</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            Tudo acontece na conversa. Você só vê a <Grad>agenda cheia.</Grad>
          </H2>
        </div>

        <div className="relative mx-auto mt-16 max-w-[1040px] [perspective:1800px] sm:mt-20">
          <div
            data-tilt
            className="relative [transform-style:preserve-3d] [transform:rotateX(6deg)_rotateY(-4deg)] md:[transform:rotateX(12deg)_rotateY(-9deg)]"
          >
            <Panel className="overflow-hidden">
              <div className="flex items-center gap-2 bg-[#12151f] px-6 py-4">
                <span aria-hidden className="size-2.5 rounded-full bg-[#ffffff22]" />
                <span aria-hidden className="size-2.5 rounded-full bg-[#ffffff22]" />
                <span aria-hidden className="size-2.5 rounded-full bg-[#ffffff22]" />
                <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8b8da3]">
                  IAzen · Painel
                </span>
              </div>

              <div className="grid md:grid-cols-[1fr_250px] lg:grid-cols-[230px_1fr_260px]">
                {/* Conversas */}
                <div className="hidden flex-col gap-1 p-4 lg:flex">
                  <p className="px-3 pb-2 pt-1 text-sm font-semibold text-white">Conversas</p>
                  {CONVERSAS.map((c) => (
                    <div
                      key={c.nome}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-3 py-3',
                        c.ativa && 'bg-[#1c2030]',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold',
                          c.ativa ? 'bg-[#7a47f5] text-white' : 'bg-[#1c2030] text-[#c4b5fd]',
                        )}
                      >
                        {c.nome[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-white">{c.nome}</span>
                          <span className="font-mono text-[10px] text-[#8b8da3]">{c.hora}</span>
                        </span>
                        <span className="block truncate text-xs text-[#9a9cae]">{c.msg}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Chat */}
                <div className="dark flex flex-col gap-3 bg-[#05060a]/60 p-5 sm:p-6">
                  <div className="mb-1 flex items-center gap-3">
                    <span
                      aria-hidden
                      className="grid size-9 place-items-center rounded-full bg-[#7a47f5] text-sm font-semibold text-white"
                    >
                      M
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Mariana</p>
                      <p className="flex items-center gap-1.5 text-xs text-[#5eead4]">
                        <span aria-hidden className="size-1.5 rounded-full bg-[#5eead4]" />
                        IA atendendo
                      </p>
                    </div>
                  </div>
                  <Bubble side="in" time="09:02">
                    Oi! Tem horário essa semana?
                  </Bubble>
                  <Bubble side="out" time="09:02">
                    Oi, Mariana! Tenho quarta às 10h ou quinta às 15h. Qual prefere?
                  </Bubble>
                  <Bubble side="in" time="09:03">
                    Quarta às 10h
                  </Bubble>
                  <Bubble side="out" time="09:03">
                    Combinado! Quarta às 10h está confirmado. Te lembro um dia antes.
                  </Bubble>
                </div>

                {/* Agenda do dia */}
                <div className="hidden bg-[#0b0c14] p-5 md:block">
                  <p className="text-sm font-semibold text-white">Agenda do dia</p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {AGENDA.map((a) => (
                      <li
                        key={a.hora}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-3 py-3',
                          a.novo ? 'bg-[#7a47f5]/25' : 'bg-[#12151f]',
                        )}
                      >
                        <span className="tabular font-mono text-xs text-[#c4b5fd]">{a.hora}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-white">{a.nome}</span>
                          <span className="block truncate text-xs text-[#9a9cae]">{a.info}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>

            {/* Cards flutuantes: sobem e descem em loop */}
            <div
              data-float
              className="absolute -top-6 left-3 z-10 flex items-center gap-3 rounded-2xl border border-[#ffffff12] bg-[#12151f] px-4 py-3 [transform:translateZ(60px)] md:-left-8 md:top-[14%]"
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#5eead4]/15 text-[#5eead4]">
                <CalendarCheck className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Novo horário agendado</span>
                <span className="block text-xs text-[#9a9cae]">Mariana · quarta, 10:00</span>
              </span>
            </div>
            <div
              data-float
              className="absolute -bottom-14 right-3 z-10 flex items-center gap-3 rounded-2xl border border-[#ffffff12] bg-[#12151f] px-4 py-3 [transform:translateZ(60px)] md:-right-10 md:-bottom-14"
            >
              <span className="grid size-9 place-items-center rounded-full bg-[#8b5cff]/20 text-[#c4b5fd]">
                <BellRing className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Lembrete 2h enviado</span>
                <span className="block text-xs text-[#9a9cae]">Diego · hoje, 13:00</span>
              </span>
            </div>
          </div>
        </div>
        <p className="mt-20 text-center text-sm text-[#8b8da3] md:mt-14">
          Exemplo ilustrativo do painel, com nomes e horários fictícios.
        </p>
      </div>
    </section>
  );
}
