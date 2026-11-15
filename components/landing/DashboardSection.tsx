import { CalendarClock, CreditCard, MessageCircle } from 'lucide-react';
import { Grad, H2, Panel, SectionLabel, WRAP } from './primitives';

const PEAK = [
  { h: '08h', v: 34 },
  { h: '09h', v: 52 },
  { h: '10h', v: 100, peak: true },
  { h: '11h', v: 64 },
  { h: '14h', v: 58 },
  { h: '15h', v: 92, peak: true },
  { h: '16h', v: 70 },
  { h: '17h', v: 40 },
];

const TOOLS = [
  { n: 'Google Agenda', i: CalendarClock },
  { n: 'WhatsApp', i: MessageCircle },
  { n: 'Stripe', i: CreditCard },
];

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

/** Seção 04: o painel com números de exemplo e a faixa de integrações reais. */
export function DashboardSection() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className={WRAP}>
        <div data-reveal>
          <SectionLabel>04 — Painel</SectionLabel>
          <H2 className="mt-5 max-w-3xl">
            Você acompanha tudo. <Grad>Em tempo real.</Grad>
          </H2>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          {/* Agendamentos */}
          <div data-reveal>
            <Panel className="h-full p-7 sm:p-8">
              <p className="text-sm text-[#9a9cae]">Agendamentos no mês</p>
              <div className="mt-2 flex items-end gap-3">
                <p className="tabular font-display text-6xl font-bold leading-none tracking-[-0.05em] text-white">
                  196
                </p>
                <p className="tabular mb-1.5 rounded-full bg-[#5eead4]/15 px-3 py-1 font-mono text-xs font-medium text-[#5eead4]">
                  +18%
                </p>
              </div>
              <svg
                viewBox="0 0 600 180"
                className="mt-8 h-auto w-full"
                role="img"
                aria-label="Gráfico de exemplo: agendamentos crescendo ao longo do mês"
              >
                <defs>
                  <linearGradient id="dash-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#a78bff" />
                    <stop offset="0.5" stopColor="#7fd8f0" />
                    <stop offset="1" stopColor="#5eead4" />
                  </linearGradient>
                  <linearGradient id="dash-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8b5cff" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#8b5cff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 90, 140].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#ffffff12" />
                ))}
                <path
                  d="M0 140 C50 132 70 118 110 112 S170 120 210 96 S270 70 310 78 S380 50 430 44 S520 52 560 24 L600 18 L600 180 L0 180 Z"
                  fill="url(#dash-fill)"
                />
                <path
                  d="M0 140 C50 132 70 118 110 112 S170 120 210 96 S270 70 310 78 S380 50 430 44 S520 52 560 24 L600 18"
                  fill="none"
                  stroke="url(#dash-line)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="600" cy="18" r="5" fill="#5eead4" />
              </svg>
            </Panel>
          </div>

          {/* Confirmação */}
          <div data-reveal data-delay="100">
            <Panel className="flex h-full flex-col items-center p-7 text-center sm:p-8">
              <p className="self-start text-sm text-[#9a9cae]">Taxa de confirmação</p>
              <div className="relative my-6 grid place-items-center">
                <svg viewBox="0 0 140 140" className="size-44 -rotate-90" aria-hidden>
                  <defs>
                    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#a78bff" />
                      <stop offset="0.5" stopColor="#7fd8f0" />
                      <stop offset="1" stopColor="#5eead4" />
                    </linearGradient>
                  </defs>
                  <circle cx="70" cy="70" r={RING_R} fill="none" stroke="#1c2030" strokeWidth="13" />
                  <circle
                    cx="70"
                    cy="70"
                    r={RING_R}
                    fill="none"
                    stroke="url(#ring)"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={`${RING_C * 0.94} ${RING_C}`}
                  />
                </svg>
                <p className="tabular absolute font-display text-4xl font-bold tracking-[-0.04em] text-white">
                  94%
                </p>
              </div>
              <p className="text-[#9a9cae]">dos atendimentos confirmados antes do horário</p>
            </Panel>
          </div>

          {/* Horários de pico */}
          <div data-reveal className="lg:col-span-2">
            <Panel className="p-7 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-[#9a9cae]">Horários de pico</p>
                <p className="font-mono text-xs text-[#8b8da3]">mais procurados: 10h e 15h</p>
              </div>
              <div className="mt-6 flex h-36 items-end gap-2 sm:gap-4" role="img" aria-label="Gráfico de exemplo: barras de procura por horário">
                {PEAK.map((b) => (
                  <div key={b.h} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={b.peak ? 'w-full rounded-t-xl bg-[#8b5cff]' : 'w-full rounded-t-xl bg-[#1c2030]'}
                      style={{ height: `calc((100% - 1.75rem) * ${b.v / 100})` }}
                    />
                    <span className="tabular font-mono text-[11px] text-[#8b8da3]">{b.h}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
        <p className="mt-5 text-sm text-[#8b8da3]">
          Os números acima são um exemplo do painel, não uma métrica de clientes.
        </p>

        <div data-reveal className="mt-14 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xl font-bold tracking-[-0.02em] text-white">
            Conecta com o que você já usa
          </p>
          <ul className="flex flex-wrap gap-3">
            {TOOLS.map(({ n, i: Icon }) => (
              <li
                key={n}
                className="flex items-center gap-2.5 rounded-full border border-[#ffffff12] bg-[#0b0c14] px-5 py-3 text-sm font-medium text-white"
              >
                <Icon className="size-4 text-[#a78bff]" aria-hidden />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
