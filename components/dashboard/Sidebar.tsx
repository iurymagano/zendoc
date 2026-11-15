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
  Sparkles,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const PRIMARY: Item[] = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/assistente', label: 'Assistente', icon: Sparkles },
  { href: '/conversas', label: 'Conversas', icon: MessagesSquare },
  { href: '/clientes', label: 'Clientes', icon: Users },
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
  const [profile, setProfile] = useState<{
    name: string;
    specialty: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/professionals');
        if (!res.ok || cancelled) return;
        const body = await res.json();
        if (!cancelled && body.professional) {
          setProfile({
            name: body.professional.name,
            specialty: body.professional.specialty ?? null,
          });
        }
      } catch {
        /* silencioso */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = (profile?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

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
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'bg-sidebar-accent text-white'
            : 'text-[var(--ia-on-void-muted)] hover:bg-[var(--ia-void-2)] hover:text-white',
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--ia-violet)]" />
        )}
        <Icon className={cn('size-[18px] shrink-0', active && 'text-[var(--ia-violet)]')} />
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5">
        <Logo size="md" href="/dashboard" />
      </div>

      <div className="flex-1 overflow-auto px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="px-3 pb-1.5 pt-7 text-xs font-semibold text-[var(--ia-on-void-muted)]">
          Configurações
        </div>
        <nav className="flex flex-col gap-0.5">
          {SETTINGS.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <div className="bg-[var(--ia-void-1)] p-3">
        {profile && (
          <div className="mb-1 flex items-center gap-3 px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ia-violet-action)] text-xs font-semibold text-white">
              {initials || '·'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{profile.name}</div>
              {profile.specialty && (
                <div className="truncate text-xs text-[var(--ia-on-void-muted)]">
                  {profile.specialty}
                </div>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ia-on-void-muted)] transition-colors hover:bg-[var(--ia-void-2)] hover:text-white"
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
      <div className="sticky top-0 z-20 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <Logo size="sm" href="/dashboard" />
        <div className="flex items-center gap-1">
          <NotificationBell variant="sheet" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="relative flex size-11 items-center justify-center rounded-xl text-[var(--ia-on-void-muted)] hover:bg-[var(--ia-void-2)] hover:text-white"
          >
            <Menu className="size-5" />
            {attention > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-[var(--ia-void)]" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar desktop (fixa) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block">
        {nav}
        {/* Sino na linha do logo (abre a lista ao lado da sidebar). */}
        <NotificationBell variant="popover" className="absolute right-3 top-2.5" />
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-[var(--ia-void)]/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-2 top-2.5 z-10 flex size-11 items-center justify-center rounded-xl text-[var(--ia-on-void-muted)] hover:bg-[var(--ia-void-2)] hover:text-white"
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
