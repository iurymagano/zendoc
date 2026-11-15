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
        {/* Conteúdo deslocado para a direita da sidebar fixa (a partir de 1024px).
            Abaixo disso a navegação é o drawer. A largura de leitura de cada página
            quem decide é o PageContainer; aqui só há um teto de 1280px. */}
        <div className="lg:pl-64">
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      {/* Avisos de notificações novas (polling do provider). */}
      <Toaster position="top-right" closeButton />
    </NotificationsProvider>
  );
}
