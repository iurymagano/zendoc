'use client';

import { createContext, useContext } from 'react';
import type { AppNotificationItem } from '@/types/database';

export type NotificationsStatus = 'loading' | 'ready' | 'error';

export interface NotificationsContextValue {
  /** Últimas notificações (mais novas primeiro). */
  items: AppNotificationItem[];
  /** Total de não lidas (pode ser maior que as listadas). */
  unreadCount: number;
  status: NotificationsStatus;
  /** Busca de novo agora (usado ao abrir o sino). */
  refresh: () => Promise<void>;
  /** Marca como lida (otimista) sem navegar. */
  markRead: (id: string) => Promise<void>;
  /** Marca todas como lidas (otimista). */
  markAllRead: () => Promise<void>;
  /** Marca como lida e navega para o assunto da notificação. */
  open: (n: AppNotificationItem) => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Estado das notificações do painel. Só funciona dentro de `NotificationsProvider`. */
export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications precisa estar dentro de <NotificationsProvider>.');
  }
  return ctx;
}
