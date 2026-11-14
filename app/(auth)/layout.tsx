import type { ReactNode } from 'react';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { Bubble } from '@/components/landing/Bubble';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[var(--ia-mist)] lg:grid-cols-[1.05fr_1fr]">
      <aside className="dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col">
        {/* O símbolo gigante, cortado pela borda: a ponta do balão aponta para a conversa */}
        <LogoMark
          size={720}
          variant="mono"
          title={null}
          className="pointer-events-none absolute -bottom-48 -left-44 text-[var(--ia-void-2)]"
        />
        <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
          <Logo size="lg" href="/" />

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-[1.02] tracking-[-0.04em] xl:text-[2.75rem]">
              Você atende.
              <br />
              Ela agenda.
            </h2>
            <p className="mt-5 text-lg leading-relaxed">
              Agenda, confirma e lembra seus clientes, direto no WhatsApp.
            </p>
            <div className="mt-10 flex flex-col gap-2.5" aria-hidden>
              <Bubble side="in" time="07:12">
                Consigo remarcar para sexta?
              </Bubble>
              <Bubble side="out" time="07:12">
                Consigo: sexta às 10:30 ou 14:00. Qual prefere?
              </Bubble>
              <Bubble side="in" time="07:13">
                10:30, obrigada!
              </Bubble>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">7 dias grátis, sem cartão.</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center lg:hidden">
            <Logo size="lg" href="/" className="text-[var(--ia-void)]" />
          </div>
          <div className="mt-8 rounded-3xl bg-card p-6 sm:p-9 lg:mt-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
