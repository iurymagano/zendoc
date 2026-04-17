import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center text-2xl font-semibold text-emerald-700 mb-8"
        >
          Zendoc
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
