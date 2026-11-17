import type { ReactNode } from 'react';
import { after } from 'next/server';
import { auth } from '@/auth';
import { touchActivity } from '@/lib/admin/activity';
import { isAdminEmail } from '@/lib/admin/access';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Rastreio de uso (painel /admin): marca o dia em que a conta abriu o painel.
  // Roda depois da resposta (after) e nunca lança, então não atrasa nem quebra a página.
  const session = await auth();
  const userId = session?.user?.id;
  if (userId) after(() => touchActivity(userId));

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background">
        <Sidebar isAdmin={isAdminEmail(session?.user?.email)} />
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
      <Toaster position="bottom-right" closeButton />
    </NotificationsProvider>
  );
}
