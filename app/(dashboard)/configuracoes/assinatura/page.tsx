import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createServerClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BillingButton } from '@/components/billing/BillingButton';
import type { Professional, PlanStatus } from '@/types/database';

const PLAN_LABEL: Record<PlanStatus, string> = {
  trialing: 'Em período de teste',
  active: 'Ativo',
  past_due: 'Pagamento em atraso',
  cancelled: 'Cancelado',
};

const PLAN_STYLE: Record<PlanStatus, string> = {
  trialing: 'bg-primary/10 text-primary ring-primary/20',
  active:
    'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900/60',
  past_due: 'bg-destructive/10 text-destructive ring-destructive/20',
  cancelled: 'bg-muted text-muted-foreground ring-border',
};

function trialDaysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function brl(amountInCents: number, currency = 'brl'): string {
  return (amountInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
}

function fmtDate(unixSeconds: number): string {
  return format(new Date(unixSeconds * 1000), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
}

type SubInfo = {
  amount: number | null;
  currency: string;
  periodEnd: number | null;
  // timestamp (unix) em que a assinatura será cancelada, ou null. Cobre os dois
  // jeitos que o Stripe representa "cancelar no fim do período": cancel_at_period_end
  // (→ usa current_period_end) e cancel_at (data explícita, usada pelo portal).
  cancelAt: number | null;
  cardBrand: string | null;
  cardLast4: string | null;
};

// Busca detalhes ao vivo no Stripe (valor, próxima cobrança, cartão). Tolerante
// a falha — se o Stripe não responder, a página ainda renderiza o básico.
async function loadSubInfo(subscriptionId: string | null): Promise<SubInfo | null> {
  if (!subscriptionId) return null;
  try {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });
    const item = sub.items.data[0];
    const pm = sub.default_payment_method;
    const card =
      pm && typeof pm === 'object' && 'card' in pm ? pm.card : null;
    // current_period_end migrou para o item da assinatura na API recente.
    const periodEnd = item?.current_period_end ?? null;
    const cancelAt =
      sub.cancel_at ?? (sub.cancel_at_period_end ? periodEnd : null);
    return {
      amount: item?.price?.unit_amount ?? null,
      currency: item?.price?.currency ?? 'brl',
      periodEnd,
      cancelAt,
      cardBrand: card?.brand ?? null,
      cardLast4: card?.last4 ?? null,
    };
  } catch {
    return null;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle<Professional>();

  if (!professional) redirect('/onboarding/step-1');

  const { success } = await searchParams;
  const status = professional.plan_status;
  const hasCustomer = !!professional.stripe_customer_id;
  const subscribed =
    !!professional.stripe_subscription_id && status !== 'cancelled';
  const trialDays = trialDaysLeft(professional.trial_ends_at);

  const info = subscribed
    ? await loadSubInfo(professional.stripe_subscription_id)
    : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        eyebrow="Configurações"
        title="Assinatura"
        description="Seu plano IAzen — R$297/mês. O teste grátis de 7 dias é liberado no cadastro."
      />

      {success && (
        <Card className="border-emerald-500/40">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-200">
            ✅ Pagamento configurado! Pode levar alguns segundos para o status
            atualizar aqui.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span>Plano IAzen</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${PLAN_STYLE[status]}`}
            >
              {PLAN_LABEL[status]}
            </span>
          </CardTitle>
          <CardDescription>
            {status === 'trialing' && trialDays !== null
              ? `Teste grátis — ${trialDays} dia${trialDays === 1 ? '' : 's'} restante${trialDays === 1 ? '' : 's'}.`
              : status === 'active'
                ? 'Assinatura ativa. A secretária virtual está liberada.'
                : status === 'past_due'
                  ? 'A última cobrança falhou e a IA foi pausada. Atualize o pagamento para reativar.'
                  : 'Sem plano ativo. Assine para liberar a secretária virtual.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Detalhes ao vivo do Stripe */}
          {info && (
            <div className="divide-y rounded-lg border border-border bg-muted/20 px-4">
              <Row
                label="Valor"
                value={
                  info.amount != null
                    ? `${brl(info.amount, info.currency)}/mês`
                    : 'R$297,00/mês'
                }
              />
              {info.cancelAt ? (
                <Row label="Acesso até" value={fmtDate(info.cancelAt)} />
              ) : (
                info.periodEnd && (
                  <Row
                    label={
                      status === 'trialing'
                        ? 'Primeira cobrança'
                        : 'Próxima cobrança'
                    }
                    value={fmtDate(info.periodEnd)}
                  />
                )
              )}
              {info.cardLast4 && (
                <Row
                  label="Cartão"
                  value={`${info.cardBrand ? info.cardBrand.toUpperCase() + ' ' : ''}•••• ${info.cardLast4}`}
                />
              )}
            </div>
          )}

          {info?.cancelAt && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:ring-amber-900/60">
              Sua assinatura será cancelada em {fmtDate(info.cancelAt)}. Você
              mantém o acesso até lá — dá pra reativar pelo botão &ldquo;Gerenciar
              assinatura&rdquo;.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {subscribed ? (
              <BillingButton
                endpoint="/api/billing/portal"
                label="Gerenciar assinatura"
              />
            ) : (
              <BillingButton
                endpoint="/api/billing/checkout"
                label={status === 'cancelled' ? 'Reativar plano' : 'Assinar agora'}
              />
            )}

            {!subscribed && hasCustomer && status === 'past_due' && (
              <BillingButton
                endpoint="/api/billing/portal"
                label="Atualizar pagamento"
                variant="outline"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground">
          O pagamento é processado pelo Stripe. Em &ldquo;Gerenciar
          assinatura&rdquo; você cancela, troca o cartão e vê suas faturas numa
          página segura do Stripe.
        </CardContent>
      </Card>
    </div>
  );
}
