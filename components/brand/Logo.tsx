import Link from 'next/link';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const TEXT_SIZE: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

const DOT_SIZE: Record<Size, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

interface Props {
  size?: Size;
  href?: string | null;
  className?: string;
}

export function Logo({ size = 'md', href = '/', className }: Props) {
  const content = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex">
        <span
          className={cn(
            'inline-block rounded-full bg-[var(--ia-accent2)]',
            DOT_SIZE[size],
          )}
        />
        <span
          className={cn(
            'absolute inset-0 inline-block rounded-full bg-[var(--ia-accent2)] opacity-50 blur-[6px]',
            DOT_SIZE[size],
          )}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          'font-display font-semibold tracking-tight',
          TEXT_SIZE[size],
        )}
        style={{ letterSpacing: '-0.03em' }}
      >
        IAzen
      </span>
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
