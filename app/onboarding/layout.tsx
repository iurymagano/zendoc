import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
        <div className="mb-8 flex justify-center text-[var(--ia-void)]">
          <Logo size="lg" href="/" />
        </div>
        <div className="rounded-3xl bg-card p-6 sm:p-9">{children}</div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Leva menos de 2 minutos.
        </p>
      </div>
    </div>
  );
}
