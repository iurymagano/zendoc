'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
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

const LINK_BASE =
  'relative flex items-center gap-3 rounded-[10px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--ia-violet)]';

/** Item de navegação. `quiet` é o tamanho menor do grupo Configurações. */
function NavItem({
  item,
  active,
  badge,
  quiet = false,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  badge?: number;
  quiet?: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        LINK_BASE,
        quiet ? 'px-3 py-2 text-[13px] font-medium' : 'px-3 py-2.5 text-sm font-medium',
        active
          ? 'bg-sidebar-accent text-white'
          : 'text-[var(--ia-on-void-muted)] hover:bg-[var(--ia-void-2)] hover:text-white',
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--ia-violet)]"
        />
      )}
      <Icon
        className={cn(
          'shrink-0',
          quiet ? 'size-4' : 'size-[18px]',
          active && 'text-[var(--ia-violet)]',
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-none text-white">
          <span className="sr-only">{badge} para responder. </span>
          <span aria-hidden="true">{badge > 9 ? '9+' : badge}</span>
        </span>
      )}
    </Link>
  );
}

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
  const [open, setOpen] = useState(false); // drawer (abaixo de 1024px)
  const [attention, setAttention] = useState(0);
  const [profile, setProfile] = useState<{
    name: string;
    specialty: string | null;
    aiEnabled: boolean | null;
    whatsappConnected: boolean | null;
  } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

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
            aiEnabled:
              typeof body.professional.ai_enabled === 'boolean' ? body.professional.ai_enabled : null,
            whatsappConnected:
              typeof body.professional.whatsapp_connected === 'boolean'
                ? body.professional.whatsapp_connected
                : null,
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

  // Drawer: Esc fecha, Tab fica preso dentro dele, a rolagem da página trava e o foco vai
  // para o botão de fechar (e volta ao botão do menu ao fechar).
  useEffect(() => {
    if (!open) return;
    const menuButton = menuRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !drawer.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      menuButton?.focus();
    };
  }, [open]);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return !!pathname?.startsWith(href);
  }

  const close = () => setOpen(false);

  // Online só com a IA ligada E o WhatsApp conectado (igual ao card "Sua secretária").
  const online = profile?.aiEnabled === true && profile.whatsappConnected !== false;
  const statusLabel =
    profile?.aiEnabled === false
      ? 'Secretária IA pausada'
      : profile?.whatsappConnected === false
        ? 'WhatsApp desconectado'
        : 'Secretária IA online';

  const nav = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo size="md" href="/dashboard" />
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-3 py-3">
        <nav aria-label="Principal" className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              badge={item.href === '/conversas' ? attention : undefined}
              onNavigate={close}
            />
          ))}
        </nav>

        <nav aria-label="Configurações" className="flex flex-col gap-0.5 rounded-2xl bg-[var(--ia-void-1)] p-1.5">
          <div
            aria-hidden="true"
            className="px-3 pb-1 pt-2 text-xs font-semibold text-[var(--ia-on-void-muted)]"
          >
            Configurações
          </div>
          {SETTINGS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              quiet
              onNavigate={close}
            />
          ))}
        </nav>
      </div>

      <div className="shrink-0 bg-[var(--ia-void-1)] p-3">
        {profile && (
          <div className="mb-1 flex items-center gap-3 px-2 py-2">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ia-violet-action)] text-xs font-semibold text-white"
            >
              {initials || '·'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{profile.name}</div>
              {profile.aiEnabled !== null ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--ia-on-void-muted)]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      online ? 'ia-spark bg-[var(--ia-spark)]' : 'bg-[var(--ia-on-void-muted)]',
                    )}
                  />
                  <span className="truncate">{statusLabel}</span>
                </div>
              ) : (
                profile.specialty && (
                  <div className="truncate text-xs text-[var(--ia-on-void-muted)]">
                    {profile.specialty}
                  </div>
                )
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className={cn(
            LINK_BASE,
            'w-full px-3 py-2.5 text-sm font-medium text-[var(--ia-on-void-muted)] hover:bg-[var(--ia-void-2)] hover:text-white',
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Topo (celular e tablet): menu, logo e sino. */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-sidebar px-2 pl-4 text-sidebar-foreground lg:hidden">
        <Logo size="sm" href="/dashboard" />
        <div className="flex items-center gap-1">
          <NotificationBell variant="sheet" />
          <button
            ref={menuRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label={attention > 0 ? `Abrir menu, ${attention} conversas para responder` : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="menu-lateral"
            className="relative flex size-11 items-center justify-center rounded-xl text-[var(--ia-on-void-muted)] outline-none transition-colors duration-150 hover:bg-[var(--ia-void-2)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--ia-violet)]"
          >
            <Menu className="size-5" />
            {attention > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-[var(--ia-void)]"
              />
            )}
          </button>
        </div>
      </header>

      {/* Sidebar fixa (desktop, a partir de 1024px). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        {nav}
        {/* Sino na linha do logo (abre a lista ao lado da sidebar). */}
        <NotificationBell variant="popover" className="absolute right-3 top-2.5" />
      </aside>

      {/* Drawer (celular e tablet): sempre montado para animar; `inert` quando fechado. */}
      <div
        className={cn(
          'fixed inset-0 z-40 [transition-property:visibility] lg:hidden',
          open ? 'visible' : 'invisible delay-200',
        )}
        inert={!open}
      >
        <div
          aria-hidden="true"
          onClick={close}
          className={cn(
            'absolute inset-0 bg-[var(--ia-void)]/60 transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          ref={drawerRef}
          id="menu-lateral"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] transition-transform duration-200 ease-[var(--ease-panel)] motion-reduce:transition-none',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Fechar menu"
            className="absolute right-2 top-2.5 z-10 flex size-11 items-center justify-center rounded-xl text-[var(--ia-on-void-muted)] outline-none transition-colors duration-150 hover:bg-[var(--ia-void-2)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--ia-violet)]"
          >
            <X className="size-5" />
          </button>
          {nav}
        </aside>
      </div>
    </>
  );
}
