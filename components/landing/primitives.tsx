import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Largura e margem externa da landing (1200px, 20px no celular, 32px acima de sm). */
export const WRAP = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8';

/** Botão branco da landing (a ação principal sobre o fundo Void). */
export const WHITE_BTN =
  'bg-white text-[#05060a] hover:bg-white/85 [a]:hover:bg-white/85';

/** Rótulo mono em caixa alta, no formato "// 01 — O produto". */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#8b8da3]',
        className,
      )}
    >
      {'// '}
      {children}
    </p>
  );
}

/** Card da landing: #0B0C14, borda #ffffff12, cantos de 32px. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[32px] border border-[#ffffff12] bg-[#0b0c14]', className)}>
      {children}
    </div>
  );
}

/** Destaque em gradiente de texto (95deg, #A78BFF para #7FD8F0 para #5EEAD4). */
export function Grad({ children }: { children: ReactNode }) {
  return <span className="ia-grad-text">{children}</span>;
}

/** Título de seção: Sora 700, no máximo 2 linhas no desktop. */
export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'font-display text-[2.1rem] font-bold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.5rem]',
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Seta em círculo escuro, usada no fim do botão branco. */
export function ArrowCircle() {
  return (
    <span
      aria-hidden
      className="ml-1 grid size-8 place-items-center rounded-full bg-[#05060a] text-white"
    >
      <ArrowRight className="size-4" />
    </span>
  );
}
