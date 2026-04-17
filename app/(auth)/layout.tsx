import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center text-2xl font-semibold text-foreground mb-8"
        >
          Zendoc
        </Link>
        <div className="bg-card rounded-xl ring-1 ring-foreground/10 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
