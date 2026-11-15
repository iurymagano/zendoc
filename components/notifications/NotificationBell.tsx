'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { NotificationList } from './NotificationList';
import { useNotifications } from './useNotifications';

const TRIGGER_CLASS =
  'relative flex size-11 items-center justify-center rounded-xl text-[var(--ia-on-void-muted)] outline-none transition-colors hover:bg-[var(--ia-void-2)] hover:text-white focus-visible:ring-3 focus-visible:ring-ring/60 aria-expanded:bg-[var(--ia-void-2)] aria-expanded:text-white';

function BellFace() {
  const { unreadCount } = useNotifications();
  return (
    <>
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span
          aria-hidden
          className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ia-violet-action)] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[var(--ia-void)]"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </>
  );
}

function useLabel() {
  const { unreadCount } = useNotifications();
  return unreadCount > 0
    ? `Notificações, ${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
    : 'Notificações';
}

/**
 * Sino do painel, sobre fundo Void. `variant="popover"` (desktop) abre uma lista
 * ao lado da sidebar; `variant="sheet"` (mobile) abre uma gaveta em tela cheia.
 * Os dois leem do mesmo `NotificationsProvider` (um polling só).
 */
export function NotificationBell({
  variant,
  className,
}: {
  variant: 'popover' | 'sheet';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { refresh } = useNotifications();
  const label = useLabel();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) void refresh(); // abre já com o estado mais novo
  }

  if (variant === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger aria-label={label} className={cn(TRIGGER_CLASS, className)}>
          <BellFace />
        </SheetTrigger>
        <SheetContent side="right" showCloseButton className="w-full gap-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Notificações</SheetTitle>
            <SheetDescription>Avisos sobre a sua agenda e o WhatsApp.</SheetDescription>
          </SheetHeader>
          {/* Folga à direita para o botão de fechar do Sheet. */}
          <NotificationList
            className="h-full pr-10 pt-3"
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger aria-label={label} className={cn(TRIGGER_CLASS, className)}>
        <BellFace />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-[26rem] max-w-[calc(100vw-2rem)] gap-0 rounded-2xl p-2"
      >
        <NotificationList
          className="max-h-[min(34rem,calc(100vh-6rem))]"
          onNavigate={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
