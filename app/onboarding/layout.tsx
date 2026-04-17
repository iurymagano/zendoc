import type { ReactNode } from 'react';

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center text-2xl font-semibold text-emerald-700 mb-8">
          Zendoc
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
