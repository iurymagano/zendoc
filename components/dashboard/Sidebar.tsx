'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Bot,
  CalendarClock,
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MessagesSquare,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const PRIMARY: Item[] = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/conversas', label: 'Conversas', icon: MessagesSquare },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
];

const SETTINGS: Item[] = [
  { href: '/configuracoes/disponibilidade', label: 'Disponibilidade', icon: Clock },
  { href: '/configuracoes/servicos', label: 'Serviços', icon: Tag },
  { href: '/configuracoes/google', label: 'Google Agenda', icon: CalendarClock },
  { href: '/configuracoes/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/configuracoes/testar-ia', label: 'Testar IA', icon: Bot },
  { href: '/configuracoes/assinatura', label: 'Assinatura', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // drawer mobile
  const [attention, setAttention] = useState(0);

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

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  }

  function NavItem({ item }: { item: Item }) {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <Icon className="size-[18px] shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.href === '/conversas' && attention > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-none text-white">
            {attention > 9 ? '9+' : attention}
          </span>
        )}
      </Link>
    );
  }

  const nav = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border bg-gradient-to-b from-primary/[0.04] to-transparent px-5">
        <Logo size="md" href="/dashboard" />
      </div>

      <div className="flex-1 overflow-auto px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="px-3 pb-1 pt-5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          Configurações
        </div>
        <nav className="flex flex-col gap-0.5">
          {SETTINGS.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px] shrink-0" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Topo mobile */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <Logo size="sm" href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="size-5" />
          {attention > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
          )}
        </button>
      </div>

      {/* Sidebar desktop (fixa) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border md:block">
        {nav}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-2 top-3 z-10 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
