import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowCircle, Grad, Panel, WHITE_BTN, WRAP } from './primitives';

/** Chamada final e rodapé: um único link legal (Privacidade), que é a página que existe. */
export function LandingFooter() {
  return (
    <footer className="pb-8">
      <div className={WRAP}>
        <div data-reveal>
          <Panel className="px-6 py-14 text-center sm:px-12 sm:py-24">
            <h2 className="mx-auto max-w-3xl font-display text-[2.1rem] font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.5rem]">
              Deixe a agenda com a IA. <Grad>Fique com o que importa.</Grad>
            </h2>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: 'lg' }), WHITE_BTN, 'mt-10 pr-2')}
            >
              Começar grátis agora
              <ArrowCircle />
            </Link>
          </Panel>
        </div>

        <div className="mt-10 flex flex-col gap-5 text-sm text-[#8b8da3] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Logo size="sm" href={null} className="text-white" />
            <span>© {new Date().getFullYear()} IAzen</span>
            <Link
              href="/privacidade"
              className="py-2 text-[#9a9cae] underline-offset-4 hover:text-white hover:underline"
            >
              Privacidade
            </Link>
          </div>
          <p>Feito com IA · Feito no Brasil</p>
        </div>
      </div>
    </footer>
  );
}
