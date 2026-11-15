import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WHITE_BTN } from './primitives';

const LINKS = [
  { href: '#produto', label: 'Produto' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#preco', label: 'Preço' },
];

/** Cabeçalho: pílula flutuante com blur, links para as âncoras e as duas ações. */
export function LandingHeader() {
  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-1 rounded-full border border-[#ffffff12] bg-[#05060a]/70 py-2 pl-4 pr-2 sm:gap-2 sm:pl-5 backdrop-blur-xl">
        <Logo size="md" />
        <nav className="hidden items-center md:flex lg:gap-1" aria-label="Principal">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium lg:px-4 text-[#9a9cae] transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), 'px-3')}>
            Entrar
          </Link>
          <Link href="/register" className={cn(buttonVariants(), WHITE_BTN, 'px-4 whitespace-nowrap')}>
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
