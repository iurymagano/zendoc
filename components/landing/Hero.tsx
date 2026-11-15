import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowCircle, WHITE_BTN, WRAP } from './primitives';

/** Pontos de fundo (poucos, CSS puro): posição em %, tamanho em px e atraso da respiração. */
const DOTS = [
  { x: 8, y: 22, s: 3, d: 0 },
  { x: 17, y: 62, s: 2, d: 1.4 },
  { x: 27, y: 12, s: 2, d: 3.1 },
  { x: 36, y: 78, s: 3, d: 2.2 },
  { x: 48, y: 8, s: 2, d: 4.5 },
  { x: 58, y: 70, s: 2, d: 0.8 },
  { x: 67, y: 18, s: 3, d: 3.8 },
  { x: 76, y: 56, s: 2, d: 1.9 },
  { x: 86, y: 26, s: 3, d: 5.2 },
  { x: 93, y: 74, s: 2, d: 2.8 },
  { x: 12, y: 88, s: 2, d: 4.1 },
  { x: 82, y: 90, s: 2, d: 0.4 },
];

/** Uma palavra do H1 (inline-block para o animejs subir cada uma). */
function Word({ children, gradient }: { children: string; gradient?: { i: number; n: number } }) {
  return (
    <span
      data-hero="word"
      className={cn('inline-block', gradient && 'ia-grad-text')}
      style={
        gradient
          ? ({
              '--gs': `${gradient.n * 100}%`,
              '--gp': gradient.n > 1 ? `${(gradient.i / (gradient.n - 1)) * 100}%` : '0%',
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-12 pt-32 sm:pb-32 sm:pt-44">
      {/* Fundo leve: um brilho radial discreto e poucos pontos respirando. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[620px] w-[900px] max-w-[160vw] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(139,92,255,0.16),transparent)]" />
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="ia-dot absolute rounded-full bg-[#c4b5fd]"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.s,
              height: d.s,
              ['--d' as string]: `${d.d}s`,
            }}
          />
        ))}
      </div>

      <div className={cn(WRAP, 'relative')}>
        <div className="flex flex-col gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#8b8da3] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p data-hero="label" className="flex items-center gap-2.5">
            <span aria-hidden className="ia-spark size-2 rounded-full bg-[#5eead4]" />
            Online 24/7<span className="hidden sm:inline"> · Secretária virtual com IA</span>
          </p>
          <p data-hero="label" className="max-sm:text-[10px] max-sm:tracking-[0.14em]">R$297/mês · 7 dias grátis sem cartão</p>
        </div>

        <h1 className="mt-10 font-display text-[2.7rem] font-bold leading-[0.98] tracking-[-0.05em] text-white sm:mt-14 sm:text-[4.6rem] md:text-[5.2rem] lg:text-[7.2rem]">
          <Word>A</Word> <Word>secretária</Word> <Word>que</Word>
          <br className="hidden sm:block" /> <Word gradient={{ i: 0, n: 2 }}>nunca</Word>{' '}
          <Word gradient={{ i: 1, n: 2 }}>dorme.</Word>
        </h1>

        <p
          data-hero="sub"
          className="mt-7 max-w-2xl text-lg leading-relaxed text-[#9a9cae] sm:mt-9 sm:text-xl"
        >
          Agenda, confirma e lembra horários 24h por dia, direto no WhatsApp dos seus clientes.
          Você ensina, ela atende.
        </p>

        <div className="mt-9 flex flex-col items-stretch gap-3 sm:mt-11 sm:flex-row sm:items-center">
          <Link
            data-hero="cta"
            href="/register"
            className={cn(buttonVariants({ size: 'lg' }), WHITE_BTN, 'pr-2')}
          >
            Testar grátis por 7 dias
            <ArrowCircle />
          </Link>
          <a
            data-hero="cta"
            href="#demo"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-[#ffffff22]! text-white hover:bg-white/10!',
            )}
          >
            Ver em ação
          </a>
        </div>
      </div>
    </section>
  );
}
