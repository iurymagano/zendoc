import type { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />
      {/* Conteúdo deslocado para a direita da sidebar fixa (desktop). */}
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
