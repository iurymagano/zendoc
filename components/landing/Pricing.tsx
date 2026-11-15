import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowCircle, Grad, H2, SectionLabel, WHITE_BTN, WRAP } from './primitives';

const STEPS = [
  { title: 'Crie sua conta', body: 'Sem cartão. O teste de 7 dias começa no cadastro.' },
  { title: 'Conecte o WhatsApp', body: 'Leia o QR code uma vez e pronto.' },
  { title: 'Ensine a IA', body: 'Tom, serviços e horários. Depois, ela atende.' },
];

const BENEFITS = [
  'Secretária no WhatsApp, 24 horas por dia',
  'Lembretes 24h e 2h antes de cada atendimento',
  'Assistente pessoal no painel para organizar o seu dia',
  'Agenda, clientes e Google Agenda no mesmo lugar',
];

/** Seção 06: três passos e o card "IAzen Pro". */
export function Pricing() {
  return (
    <section id="preco" className="scroll-mt-20 pb-24 sm:pb-32">
      <div className={WRAP}>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <div data-reveal>
              <SectionLabel>06 — Preço</SectionLabel>
              <H2 className="mt-5">
                Um preço só. <Grad>Comece de graça.</Grad>
              </H2>
            </div>
            <ol className="mt-10 flex flex-col gap-7">
              {STEPS.map((s, i) => (
                <li key={s.title} data-reveal data-delay={i * 90} className="flex gap-5">
                  <span className="tabular mt-0.5 font-mono text-sm text-[#a78bff]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block font-display text-xl font-bold tracking-[-0.02em] text-white">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-[#9a9cae]">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div data-reveal>
            <div className="rounded-[32px] border border-[#8b5cff]/40 bg-[#0b0c14] p-7 sm:p-10">
              <p className="font-display text-lg font-bold tracking-[-0.02em] text-[#c4b5fd]">
                IAzen Pro
              </p>
              <p className="mt-4 font-display font-bold leading-none tracking-[-0.05em] text-white">
                <span className="text-[4.2rem] sm:text-[5.2rem]">R$297</span>
                <span className="ml-1.5 text-xl font-light tracking-[-0.02em] text-[#9a9cae]">
                  /mês
                </span>
              </p>
              <p className="mt-3 inline-block rounded-full bg-[#5eead4]/15 px-3.5 py-1.5 text-sm font-medium text-[#5eead4]">
                7 dias grátis
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-white">
                    <Check className="mt-1 size-4 shrink-0 text-[#5eead4]" strokeWidth={2.5} aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'lg' }), WHITE_BTN, 'mt-10 w-full justify-between pr-2')}
              >
                Testar grátis por 7 dias
                <ArrowCircle />
              </Link>
              <p className="mt-4 text-center text-sm text-[#8b8da3]">
                Sem cartão · Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
