import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: { absolute: 'Admin · IAzen' },
  robots: { index: false, follow: false },
};

/**
 * Layout do /admin: fora do grupo (dashboard), sem sidebar. Barra no topo com o logo,
 * o nome da área e o caminho de volta ao painel. A guarda de acesso fica em `page.tsx`.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/dashboard" />
            <span aria-hidden="true" className="h-5 w-px bg-border" />
            <span className="font-display text-base font-bold tracking-[-0.03em]">Admin</span>
          </div>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar ao painel
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
