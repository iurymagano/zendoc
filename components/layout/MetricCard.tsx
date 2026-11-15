import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Número em destaque com legenda: o valor em Sora (tabular), o rótulo em Inter
 * e uma dica opcional. Com `href` vira link inteiro para a tela do detalhe.
 * O ícone é só apoio (aria-hidden); o rótulo diz o que é.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: ReactNode;
  icon?: LucideIcon;
  href?: string;
  className?: string;
}) {
  const body = (
    <Card
      size="sm"
      className={cn(
        'h-full gap-2 rounded-[var(--radius-card)] px-4 ring-0 transition-colors duration-150',
        href && 'hover:bg-surface-2',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
      </div>
      <span className="font-display text-3xl font-bold leading-none tracking-[-0.04em] tabular-nums">
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Card>
  );
  if (!href) return body;
  return (
    <Link
      href={href}
      className="block rounded-[var(--radius-card)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {body}
    </Link>
  );
}
