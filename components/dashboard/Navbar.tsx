'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ChevronDown } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Áreas de trabalho do dia a dia — sempre visíveis no topo.
const PRIMARY = [
  { href: '/dashboard', label: 'Visão geral' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/conversas', label: 'Conversas' },
  { href: '/pacientes', label: 'Pacientes' },
];

// Configurações do consultório — agrupadas no menu "Configurações".
const SETTINGS = [
  { href: '/configuracoes/disponibilidade', label: 'Disponibilidade' },
  { href: '/configuracoes/servicos', label: 'Serviços' },
  { href: '/configuracoes/google', label: 'Google Agenda' },
  { href: '/configuracoes/whatsapp', label: 'WhatsApp' },
  { href: '/configuracoes/testar-ia', label: 'Testar IA' },
  { href: '/configuracoes/assinatura', label: 'Assinatura' },
];

export function Navbar() {
  const pathname = usePathname();
  const [attention, setAttention] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Notificação de conversas que precisam de resposta — atualiza a cada 30s e
  // ao navegar entre páginas do dashboard.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/conversations/attention-count');
        if (!res.ok || cancelled) return;
        const body = await res.json();
        if (!cancelled) setAttention(body.count ?? 0);
      } catch {
        /* silencioso */
      }
    }
    void load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  // Fecha o menu de Configurações ao clicar fora.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  }
  const settingsActive = pathname?.startsWith('/configuracoes');

  function ConversasBadge() {
    if (attention <= 0) return null;
    return (
      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white shadow-sm ring-2 ring-background">
        {attention > 9 ? '9+' : attention}
      </span>
    );
  }

  const linkBase =
    'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
  const linkIdle =
    'text-muted-foreground hover:bg-muted hover:text-foreground';
  const linkActive = 'bg-primary/10 text-primary';

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-6">
          <Logo size="md" href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex">
            {PRIMARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(linkBase, isActive(item.href) ? linkActive : linkIdle)}
              >
                {item.label}
                {item.href === '/conversas' && <ConversasBadge />}
              </Link>
            ))}

            {/* Configurações — dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className={cn(
                  linkBase,
                  'inline-flex items-center gap-1',
                  settingsActive || settingsOpen ? linkActive : linkIdle,
                )}
                aria-expanded={settingsOpen}
                aria-haspopup="menu"
              >
                Configurações
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform',
                    settingsOpen && 'rotate-180',
                  )}
                />
              </button>
              {settingsOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                  {SETTINGS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setSettingsOpen(false)}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sair
        </Button>
      </div>

      {/* Mobile: áreas principais + configurações em linhas que quebram */}
      <nav className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-border/60 px-4 py-2 md:hidden">
        <div className="flex flex-wrap gap-1">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                isActive(item.href) ? linkActive : linkIdle,
              )}
            >
              {item.label}
              {item.href === '/conversas' && <ConversasBadge />}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 border-t border-border/40 pt-2">
          <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
            Config
          </span>
          {SETTINGS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                isActive(item.href) ? linkActive : linkIdle,
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
