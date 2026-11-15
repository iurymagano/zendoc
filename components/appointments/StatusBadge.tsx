import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types/database';
import { STATUS } from './status';

/**
 * Pílula de status do atendimento, lida de `status.ts`: ícone + rótulo (a cor
 * nunca é a única pista). `iconOnly` esconde o texto só da vista, mantendo-o
 * para leitor de tela e tooltip nativo.
 */
export function StatusBadge({
  status,
  iconOnly = false,
  className,
}: {
  status: AppointmentStatus;
  iconOnly?: boolean;
  className?: string;
}) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <Badge
      variant="plain"
      title={s.description}
      className={cn(s.badge, 'font-semibold', className)}
    >
      <Icon aria-hidden="true" data-icon="inline-start" />
      <span className={iconOnly ? 'sr-only' : undefined}>{s.label}</span>
    </Badge>
  );
}
