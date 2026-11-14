import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { HeroChat } from '@/components/landing/HeroChat';
import { WeekGrid } from '@/components/landing/WeekGrid';
import { ReminderTimeline } from '@/components/landing/ReminderTimeline';
import { ToneDemo } from '@/components/landing/ToneDemo';
import { AssistantDemo } from '@/components/landing/AssistantDemo';
import { cn } from '@/lib/utils';

const WRAP = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8';

const INCLUDED = [
  'Secretária no WhatsApp, 24 horas por dia',
  'Lembretes 24h e 2h antes de cada atendimento',
  'Assistente pessoal no painel: converse e ela organiza o seu dia',
  'Agenda, clientes e declarações no painel',
  'Cancele quando quiser',
];

export default function Home() {
  return (
    <div className="bg-[var(--ia-mist)] text-[var(--ia-void)]">
      {/* Hero: Void, a conversa é a prova */}
      <div className="dark bg-background text-foreground">
        <header className={cn(WRAP, 'flex items-center justify-between py-5')}>
          <Logo size="md" />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <a href="#agenda" className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium hover:text-[var(--ia-violet)] lg:block">
              Como funciona
            </a>
            <a href="#lembretes" className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium hover:text-[var(--ia-violet)] lg:block">
              Lembretes
            </a>
            <a href="#assistente" className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium hover:text-[var(--ia-violet)] lg:block">
              Assistente
            </a>
            <a href="#preco" className="mr-3 hidden whitespace-nowrap px-3 py-2 text-sm font-medium hover:text-[var(--ia-violet)] lg:block">
              Preço
            </a>
            <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
              Entrar
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Começar grátis
            </Link>
          </nav>
        </header>

        <main>
          <section className={cn(WRAP, 'grid items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-16')}>
            <div>
              <h1 className="text-[2.9rem] font-bold leading-[0.96] tracking-[-0.04em] sm:text-[4rem] lg:text-[4.5rem] xl:text-[5.25rem]">
                Você atende.
                <br />
                Ela agenda.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed sm:text-xl">
                IAzen é a secretária no WhatsApp de quem atende com hora marcada.
                Agenda, confirma e lembra seus clientes, 24 horas por dia, no tom que você escolher.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/register" className={buttonVariants({ size: 'lg' })}>
                  Testar grátis por 7 dias
                </Link>
                <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                  Já tenho conta
                </Link>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Sem cartão para começar. Depois do teste, R$297 por mês.
              </p>
              <p className="mt-10 max-w-md text-base text-muted-foreground">
                Para barbeiros, cabeleireiras, manicures, personais, psicólogos, advogados, consultores, professoras particulares e tatuadores.
              </p>
            </div>
            <HeroChat />
          </section>
        </main>
      </div>

      {/* Agenda: Névoa, a semana que a secretária enxerga */}
      <section id="agenda" className="scroll-mt-4 py-20 sm:py-28">
        <div className={WRAP}>
          <h2 className="max-w-4xl text-[2rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]">
            Ela só oferece o que está livre.
          </h2>
          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="max-w-md text-lg leading-relaxed">
              <p>
                Você define os blocos de cada dia da semana e as folgas. O almoço nunca é
                oferecido, e o horário que já foi marcado sai da lista na hora.
              </p>
              <p className="mt-5">
                Os atendimentos têm 50 minutos, ou o tempo que você configurar. Se prefere aprovar
                cada pedido, ele chega ao painel como pendente até você confirmar.
              </p>
            </div>
            <WeekGrid />
          </div>
        </div>
      </section>

      {/* Lembretes: Void, a linha do tempo de um atendimento */}
      <section id="lembretes" className="dark scroll-mt-4 bg-background py-20 text-foreground sm:py-28">
        <div className={WRAP}>
          <h2 className="max-w-4xl text-[2rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]">
            Ninguém esquece o horário.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">
            A secretária lembra o cliente um dia antes e de novo duas horas antes, na mesma
            conversa em que ele marcou.
          </p>
          <div className="mt-12 lg:mt-16">
            <ReminderTimeline />
          </div>
        </div>
      </section>

      {/* Tom: Névoa, a mesma resposta em dois jeitos */}
      <section className="py-20 sm:py-28">
        <div className={cn(WRAP, 'grid items-center gap-12 lg:grid-cols-2 lg:gap-20')}>
          <div className="lg:order-2">
            <h2 className="text-[2rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3rem]">
              Responde do jeito que você responderia.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed">
              Escolha entre o tom amigável e o formal, e acrescente instruções suas, como
              &ldquo;peça para chegar 10 minutos antes&rdquo; ou &ldquo;não atendo às quartas à tarde&rdquo;.
            </p>
          </div>
          <div className="lg:order-1">
            <ToneDemo />
          </div>
        </div>
      </section>

      {/* Assistente pessoal: Void, a IA também cuida de você */}
      <section id="assistente" className="dark scroll-mt-4 bg-background py-20 text-foreground sm:py-28">
        <div className={cn(WRAP, 'grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20')}>
          <div>
            <h2 className="text-[2rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3rem]">
              E ela também organiza o seu dia.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed">
              No painel, converse com o seu Assistente pessoal como numa conversa com uma
              secretária de verdade: marque compromissos na sua agenda, crie lembretes para você
              mesmo e peça o resumo do dia. Ela gerencia tudo.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'mt-8')}
            >
              Conhecer o assistente
            </Link>
          </div>
          <AssistantDemo />
        </div>
      </section>

      {/* Preço e chamada: Violeta */}
      <section id="preco" className="relative scroll-mt-4 overflow-hidden bg-[var(--ia-violet)] py-20 text-[var(--ia-void)] sm:py-28">
        <LogoMark
          size={620}
          variant="mono"
          title={null}
          className="pointer-events-none absolute -bottom-40 -right-32 hidden text-[var(--ia-violet-action)] lg:block"
        />
        <div className={cn(WRAP, 'relative')}>
          <p className="font-display text-[4.5rem] font-bold leading-none tracking-[-0.05em] text-white sm:text-[7rem] lg:text-[9rem]">
            R$297
            <span className="ml-2 text-[1.75rem] font-light tracking-[-0.02em] sm:text-4xl">/mês</span>
          </p>
          <h2 className="mt-6 max-w-2xl text-[1.75rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-4xl">
            Os 7 primeiros dias são por nossa conta, sem cartão.
          </h2>
          <ul className="mt-8 flex max-w-xl flex-col gap-2.5 text-lg">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-[var(--ia-void)]" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'mt-10 bg-[var(--ia-void)] text-white hover:bg-[var(--ia-void-2)]',
            )}
          >
            Começar o teste grátis
          </Link>
        </div>
      </section>

      <footer className="dark bg-background text-foreground">
        <div className={cn(WRAP, 'flex flex-wrap items-center justify-between gap-4 py-8 text-sm')}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Logo size="sm" href={null} />
            <span className="text-muted-foreground">© {new Date().getFullYear()} IAzen</span>
            <Link href="/privacidade" className="underline-offset-4 hover:underline">
              Privacidade
            </Link>
          </div>
          <span className="text-muted-foreground">Feito com IA, hospedado no Brasil</span>
        </div>
      </footer>
    </div>
  );
}
