import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

const TESTIMONIALS = [
  'Reduza faltas em até 40% com lembretes automáticos.',
  'Pacientes agendam sozinhos, 24h por dia, direto no WhatsApp.',
  'Funciona para psicólogos, nutricionistas e fisioterapeutas.',
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,110,247,0.25),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(124,58,237,0.25),transparent_55%)]"
        />
        <div className="relative flex flex-1 flex-col justify-between p-12">
          <Logo size="lg" href="/" />
          <div className="max-w-md">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Secretária virtual com IA
            </span>
            <h2
              className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              Agenda, confirma e lembra —{' '}
              <span className="bg-gradient-to-r from-[var(--ia-accent)] to-[var(--ia-accent2)] bg-clip-text text-transparent">
                direto no WhatsApp
              </span>
              .
            </h2>
            <ul className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground">
              {TESTIMONIALS.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ia-accent)]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            7 dias grátis · sem cartão
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center lg:hidden">
            <Logo size="lg" href="/" />
          </div>
          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-8 shadow-sm ring-1 ring-foreground/5 lg:mt-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
