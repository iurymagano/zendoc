import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PLAN_LABEL, type PlanKey } from './format';

/** Cores dos tokens de status do painel (DESIGN.md); o texto do selo é sempre a pista principal. */
const STYLE: Record<PlanKey, string> = {
  paying: 'bg-status-confirmed-soft text-status-confirmed',
  trial: 'bg-status-scheduled-soft text-status-scheduled',
  trial_expired: 'bg-status-pending-soft text-status-pending',
  past_due: 'bg-status-noshow-soft text-status-noshow',
  cancelled: 'bg-status-cancelled-soft text-status-cancelled',
  no_onboarding: 'border-border bg-transparent text-muted-foreground',
};

export function PlanBadge({ plan }: { plan: PlanKey }) {
  return (
    <Badge variant="plain" className={cn(STYLE[plan])}>
      {PLAN_LABEL[plan]}
    </Badge>
  );
}
