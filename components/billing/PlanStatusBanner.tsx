import type { Professional } from '@/types/database';
import { BillingButton } from './BillingButton';

type BannerVariant = 'past_due' | 'cancelled' | 'trial_ending' | 'trial_expired';

type Cta = {
  endpoint: '/api/billing/checkout' | '/api/billing/portal';
  label: string;
};

type BannerContent = {
  variant: BannerVariant;
  title: string;
  description: string;
  cta: Cta;
};

const STYLES: Record<BannerVariant, string> = {
  past_due: 'border-destructive/40 bg-destructive/10 text-destructive',
  cancelled: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  trial_ending:
    'border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100',
  trial_expired:
    'border-destructive/40 bg-destructive/10 text-destructive',
};

function buildBanner(professional: Professional): BannerContent | null {
  if (professional.plan_status === 'past_due') {
    return {
      variant: 'past_due',
      title: 'Pagamento em atraso',
      description:
        'A cobrança do seu plano falhou — a secretária virtual foi pausada automaticamente. Atualize sua forma de pagamento para reativar.',
      cta: { endpoint: '/api/billing/portal', label: 'Atualizar pagamento' },
    };
  }

  if (professional.plan_status === 'cancelled') {
    return {
      variant: 'cancelled',
      title: 'Plano cancelado',
      description:
        'Seu plano foi cancelado. Os dados serão mantidos por 30 dias — reative antes desse prazo para não perder nada.',
      cta: { endpoint: '/api/billing/checkout', label: 'Reativar plano' },
    };
  }

  if (professional.plan_status === 'trialing' && professional.trial_ends_at) {
    const ms = new Date(professional.trial_ends_at).getTime() - Date.now();
    const days = Math.ceil(ms / 86_400_000);

    if (days <= 0) {
      return {
        variant: 'trial_expired',
        title: 'Trial expirado',
        description:
          'Seu trial terminou. Configure o pagamento para continuar usando o IAzen sem interrupção.',
        cta: { endpoint: '/api/billing/checkout', label: 'Assinar agora' },
      };
    }

    if (days <= 3) {
      const suffix = days === 1 ? 'dia' : 'dias';
      return {
        variant: 'trial_ending',
        title: `Seu trial termina em ${days} ${suffix}`,
        description:
          'Configure o pagamento para manter a secretária virtual ativa após o fim do trial.',
        cta: { endpoint: '/api/billing/checkout', label: 'Assinar agora' },
      };
    }
  }

  return null;
}

export function PlanStatusBanner({ professional }: { professional: Professional }) {
  const banner = buildBanner(professional);
  if (!banner) return null;

  return (
    <div className={`rounded-lg border p-4 ${STYLES[banner.variant]}`}>
      <h2 className="text-sm font-semibold">{banner.title}</h2>
      <p className="text-sm opacity-90 mt-1">{banner.description}</p>
      <BillingButton
        endpoint={banner.cta.endpoint}
        label={banner.cta.label}
        variant="outline"
        className="mt-3"
      />
    </div>
  );
}
