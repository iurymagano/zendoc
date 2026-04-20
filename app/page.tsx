import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

const FEATURES = [
  {
    title: 'Agenda 24/7 no WhatsApp',
    description:
      'Pacientes marcam, remarcam e cancelam sozinhos, direto na conversa que já conhecem.',
  },
  {
    title: 'Confirma e lembra sem esforço',
    description:
      'Lembretes automáticos de 24h e 2h — menos faltas, agenda cheia.',
  },
  {
    title: 'IA que fala com seu tom',
    description:
      'Ajuste a personalidade da secretária e ela responde como se fosse da sua equipe.',
  },
];

const PROOF = [
  { label: 'Psicólogos' },
  { label: 'Nutricionistas' },
  { label: 'Fisioterapeutas' },
  { label: 'Terapeutas' },
  { label: 'Fonoaudiólogos' },
];

export default function Home() {
  return (
    <div className="dark relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-20%] -z-10 flex justify-center"
      >
        <div className="h-[620px] w-[1100px] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,110,247,0.25),transparent_60%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[30%] -z-10 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22),transparent_70%)]"
      />

      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="md" href="/" />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: 'ghost', size: 'lg' })}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ size: 'lg' })}
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="relative inline-block">
              <span className="absolute inset-0 inline-block h-1.5 w-1.5 animate-ping rounded-full bg-[var(--ia-accent2)] opacity-60" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[var(--ia-accent2)]" />
            </span>
            Secretária virtual com IA para profissionais de saúde
          </div>

          <h1
            className="mt-8 font-display text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl md:text-7xl"
            style={{ letterSpacing: '-0.04em' }}
          >
            Sua secretária virtual
            <br />
            <span className="bg-gradient-to-r from-[var(--ia-accent)] via-[var(--ia-accent2)] to-[var(--ia-accent)] bg-clip-text text-transparent">
              direto no WhatsApp
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Agenda, confirma e gerencia consultas automaticamente — 24h por dia,
            direto no WhatsApp dos seus pacientes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={buttonVariants({ size: 'lg' })}
            >
              Testar grátis por 7 dias
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Já tenho conta
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            R$297/mês · sem cartão no trial · cancele quando quiser
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/40 p-6 backdrop-blur transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                    0{i + 1}
                  </span>
                  <span className="h-px flex-1 bg-border/60" />
                </div>
                <h3
                  className="mt-4 font-display text-lg font-semibold tracking-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="rounded-2xl border border-border/70 bg-card/40 p-8 backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Feito para
              </span>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/80">
                {PROOF.map((p, i) => (
                  <span key={p.label} className="flex items-center gap-6">
                    {p.label}
                    {i < PROOF.length - 1 && (
                      <span className="h-1 w-1 rounded-full bg-border" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Logo size="sm" href={null} />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <span className="font-mono uppercase tracking-[0.14em]">
            Feito com IA · hospedado no Brasil
          </span>
        </div>
      </footer>
    </div>
  );
}
