'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Visão geral' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/conversas', label: 'Conversas' },
  { href: '/pacientes', label: 'Pacientes' },
  { href: '/configuracoes/disponibilidade', label: 'Disponibilidade' },
  { href: '/configuracoes/servicos', label: 'Serviços' },
  { href: '/configuracoes/google', label: 'Google Agenda' },
  { href: '/configuracoes/whatsapp', label: 'WhatsApp' },
  { href: '/configuracoes/testar-ia', label: 'Testar IA' },
  { href: '/configuracoes/assinatura', label: 'Assinatura' },
];

export function Navbar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href.startsWith('/configuracoes/'))
      return pathname?.startsWith(href);
    return pathname?.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-8">
          <Logo size="md" href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sair
          </Button>
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 border-t border-border/60 px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
