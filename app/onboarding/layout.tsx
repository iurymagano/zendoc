import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-10%] -z-10 flex justify-center"
      >
        <div className="h-[480px] w-[900px] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,110,247,0.12),transparent_65%)]" />
      </div>
      <div className="relative mx-auto w-full max-w-xl px-4 py-12">
        <div className="mb-10 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-sm ring-1 ring-foreground/5">
          {children}
        </div>
        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Leva menos de 2 minutos
        </p>
      </div>
    </div>
  );
}
