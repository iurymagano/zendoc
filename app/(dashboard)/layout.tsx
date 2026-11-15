import type { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Conteúdo deslocado para a direita da sidebar fixa (desktop). */}
        <div className="md:pl-64">
          <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">
            {children}
          </main>
        </div>
      </div>
      {/* Avisos de notificações novas (polling do provider). */}
      <Toaster position="top-right" closeButton />
    </NotificationsProvider>
  );
}
