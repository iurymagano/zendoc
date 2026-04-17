import type { ReactNode } from 'react';

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center text-2xl font-semibold text-foreground mb-8">
          Zendoc
        </div>
        <div className="bg-card rounded-xl ring-1 ring-foreground/10 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
