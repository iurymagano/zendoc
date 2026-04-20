import type { ReactNode } from 'react';
import { Navbar } from '@/components/dashboard/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
