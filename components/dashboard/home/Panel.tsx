import type { ReactNode } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { cn } from '@/lib/utils';

/**
 * Card do painel inicial: branco sobre a Névoa (o degrau de tom separa, sem linha
 * nem sombra), canto de 16px. Cabeçalho com `SectionHeader` (Inter 15px semibold),
 * descrição opcional e uma ação à direita.
 */
export function Panel({
  title,
  description,
  action,
  id,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card
      id={id}
      className={cn('scroll-mt-20 gap-4 rounded-[var(--radius-card)] py-5 ring-0', className)}
    >
      <SectionHeader title={title} description={description} action={action} className="px-5" />
      <div className="flex flex-col gap-4 px-5">{children}</div>
    </Card>
  );
}

/** Link de texto de canto de painel ("Abrir agenda", "Ver todas"). */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm text-sm font-medium text-[var(--ia-violet-ink)] underline underline-offset-4 outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </Link>
  );
}

/**
 * Estado vazio de um card: o que falta, por que importa e um botão para a rota que resolve.
 * Texto na cor cheia da tinta (a explicação a 80%), nunca cinza sobre cinza.
 */
export function EmptyState({
  title,
  children,
  href,
  cta,
  className,
}: {
  title: string;
  children: ReactNode;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-[var(--radius-field)] bg-background p-4 text-sm leading-relaxed',
        className,
      )}
    >
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-foreground/80">{children}</p>
      </div>
      <Link
        href={href}
        className={buttonVariants({ variant: 'default', size: 'sm', className: 'min-h-11 sm:min-h-9' })}
      >
        {cta}
      </Link>
    </div>
  );
}
