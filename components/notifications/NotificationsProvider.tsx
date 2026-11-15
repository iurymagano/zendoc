'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { notificationHref } from '@/lib/notifications/links';
import type { AppNotificationItem } from '@/types/database';
import {
  NotificationsContext,
  type NotificationsContextValue,
  type NotificationsStatus,
} from './useNotifications';

/** Intervalo do polling (só com a aba visível). */
const POLL_MS = 20_000;
/** Mais que isso de novas de uma vez vira um aviso só (evita enxurrada de toasts). */
const MAX_INDIVIDUAL_TOASTS = 3;

type ListResponse = { notifications: AppNotificationItem[]; unreadCount: number };

/**
 * Único dono do polling e do estado das notificações do painel. Os dois sinos
 * (sidebar desktop e topo mobile) leem daqui, então há UM timer e UM fetch por
 * vez, e a lista fica igual nos dois.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<NotificationsStatus>('loading');

  const seenIds = useRef<Set<string> | null>(null); // null = ainda não carregou
  const inFlight = useRef(false);
  const stopped = useRef(false); // sessão expirou: para de tentar
  const openRef = useRef<(n: AppNotificationItem) => void>(() => {});

  const announceNew = useCallback((fresh: AppNotificationItem[]) => {
    if (fresh.length === 0) return;
    if (fresh.length > MAX_INDIVIDUAL_TOASTS) {
      toast(`${fresh.length} novas notificações`, {
        id: 'notifications-many',
        description: 'Abra o sino para ver o que aconteceu.',
        duration: 8000,
      });
      return;
    }
    // Mais antiga primeiro, para a mais nova ficar por último (em cima).
    for (const n of [...fresh].reverse()) {
      toast(n.title, {
        id: n.id,
        description: n.body,
        duration: 8000,
        action: { label: 'Ver', onClick: () => openRef.current(n) },
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current || stopped.current) return;
    inFlight.current = true;
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.status === 401) {
        stopped.current = true;
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as ListResponse;

      // Primeira carga: só "semeia" os ids (não avisa o que já estava lá).
      // Depois: toast para o que é novo E ainda não lido (as ações do próprio
      // dono já nascem lidas e não geram toast).
      if (seenIds.current === null) {
        seenIds.current = new Set(body.notifications.map((n) => n.id));
      } else {
        const known = seenIds.current;
        const fresh = body.notifications.filter((n) => !known.has(n.id));
        for (const n of body.notifications) known.add(n.id);
        announceNew(fresh.filter((n) => n.read_at === null));
      }

      setItems(body.notifications);
      setUnreadCount(body.unreadCount);
      setStatus('ready');
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      // Mantém o que já tinha; só marca erro se nunca carregou.
      setStatus((s) => (s === 'ready' ? s : 'error'));
    } finally {
      inFlight.current = false;
    }
  }, [announceNew]);

  // Polling a cada 20s com a aba visível + refresh ao voltar para a aba.
  useEffect(() => {
    void (async () => {
      await refresh();
    })();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      let wasUnread = false;
      setItems((prev) =>
        prev.map((n) => {
          if (n.id !== id || n.read_at !== null) return n;
          wasUnread = true;
          return { ...n, read_at: new Date().toISOString() };
        }),
      );
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
      } catch (err) {
        console.error('Erro ao marcar notificação como lida:', err);
        void refresh(); // desfaz o otimismo com o estado real do servidor
      }
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at === null ? { ...n, read_at: now } : n)));
    setUnreadCount(0);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      void refresh();
    }
  }, [refresh]);

  const open = useCallback(
    (n: AppNotificationItem) => {
      toast.dismiss(n.id);
      void markRead(n.id);
      router.push(notificationHref(n));
    },
    [markRead, router],
  );
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ items, unreadCount, status, refresh, markRead, markAllRead, open }),
    [items, unreadCount, status, refresh, markRead, markAllRead, open],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
