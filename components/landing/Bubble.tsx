import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  /** `in`: mensagem do cliente (ponta embaixo à esquerda, como o logo). `out`: da secretária. */
  side: 'in' | 'out';
  time?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Balão de conversa de WhatsApp. Use dentro de um contêiner `.dark`. */
export function Bubble({ side, time, children, className, style }: Props) {
  const out = side === 'out';
  return (
    <div
      className={cn('flex', out ? 'justify-end' : 'justify-start', className)}
      style={style}
    >
      <p
        className={cn(
          'max-w-[85%] rounded-[18px] px-4 py-2.5 text-[15px] leading-snug',
          out
            ? 'rounded-br-[4px] bg-primary text-primary-foreground'
            : 'rounded-bl-[4px] bg-secondary text-secondary-foreground',
        )}
      >
        {children}
        {time && (
          <span
            className={cn(
              'tabular ml-2 inline-block translate-y-[3px] text-[11px]',
              out ? 'text-white/75' : 'text-muted-foreground',
            )}
          >
            {time}
          </span>
        )}
      </p>
    </div>
  );
}
