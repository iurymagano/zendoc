# components/notifications/

O sino de notificações do painel: estado compartilhado com polling, a lista e o gatilho (popover no desktop, sheet no celular).

---

## useNotifications.ts

**O que faz:** define o contexto das notificações e o hook para lê-lo.

**Exporta:**

- `NotificationsContext` — contexto (usado só pelo provider).
- `useNotifications(): NotificationsContextValue` — `{ items, unreadCount, status, refresh, markRead, markAllRead, open }`. Lança se usado fora de `NotificationsProvider`.
- tipos `NotificationsStatus` (`'loading' | 'ready' | 'error'`) e `NotificationsContextValue`.

**Notas:** `open(n)` marca como lida e navega para `notificationHref(n)`.

---

## NotificationsProvider.tsx

**O que faz:** único dono do estado e do polling. Os dois sinos (sidebar desktop e topo mobile) leem dele, então há UM timer e UM fetch por vez.

**Exporta:**

- `NotificationsProvider({ children })` — montado em `app/(dashboard)/layout.tsx`.

**Depende de:** `GET /api/notifications`, `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`, `lib/notifications/links.ts`, `sonner`.

**Notas:**

- Polling a cada 20 s, só com a aba visível; ao voltar para a aba (`visibilitychange`/`focus`) busca na hora.
- Toast (sonner) só para notificações NOVAS e não lidas que ainda não tinham sido vistas; a primeira carga não dispara toast. Mais de 3 novas de uma vez viram um aviso único. Ações do próprio profissional nascem lidas e não geram toast.
- Marcar como lida é otimista (reverte com um refresh se a API falhar). 401 para o polling (sessão expirou).

---

## NotificationList.tsx

**O que faz:** o conteúdo do painel do sino: cabeçalho com "Marcar todas como lidas", lista (ícone por tipo, título, texto curto, "há 5 min", não lida em destaque) e estado vazio com o símbolo da marca.

**Exporta:**

- `NotificationList({ onNavigate?, className? })` — `onNavigate` fecha o popover/sheet ao clicar numa notificação.

**Depende de:** `useNotifications.ts`, `lib/notifications/relative-time.ts`, `components/dashboard/EmptyState.tsx`.

---

## NotificationBell.tsx

**O que faz:** o botão do sino com o selo de não lidas, abrindo a lista.

**Exporta:**

- `NotificationBell({ variant, className? })` — `variant="popover"` (desktop, Popover) ou `variant="sheet"` (celular, painel lateral); o selo mostra "9+" acima de 9.

**Depende de:** `components/ui/popover.tsx`, `components/ui/sheet.tsx`, `NotificationList.tsx`.

**Notas:** ao abrir, faz um `refresh()` para não mostrar lista velha. O selo é decorativo (`aria-hidden`); o `aria-label` do botão informa a contagem.
