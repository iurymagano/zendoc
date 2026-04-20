import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { PlanStatusBanner } from '@/components/billing/PlanStatusBanner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import type { Professional, PlanStatus } from '@/types/database';

const PLAN_LABEL: Record<PlanStatus, string> = {
  trialing: 'Trial',
  active: 'Ativo',
  past_due: 'Em atraso',
  cancelled: 'Cancelado',
};

const PLAN_STYLE: Record<PlanStatus, string> = {
  trialing: 'bg-primary/10 text-primary border-primary/20',
  active:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900/50',
  past_due: 'bg-destructive/10 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle<Professional>();

  if (!professional) redirect('/onboarding/step-1');

  const [{ count: weeklyBlocks }, { count: patientsCount }, { count: upcomingCount }] =
    await Promise.all([
      supabase
        .from('availability_weekly')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', professional.id)
        .eq('is_active', true),
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', professional.id),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', professional.id)
        .in('status', ['scheduled', 'confirmed', 'pending_approval'])
        .gte('starts_at', new Date().toISOString()),
    ]);

  const availabilityConfigured = (weeklyBlocks ?? 0) > 0;
  const trialDaysLeft = daysUntil(professional.trial_ends_at);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Plano · ${PLAN_LABEL[professional.plan_status]}`}
        title={`Olá, ${professional.name.split(' ')[0]}`}
        description={
          professional.specialty
            ? `${professional.specialty} · gerencie sua agenda e sua secretária virtual.`
            : 'Gerencie sua agenda e sua secretária virtual.'
        }
        actions={
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${PLAN_STYLE[professional.plan_status]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {PLAN_LABEL[professional.plan_status]}
            {trialDaysLeft !== null && professional.plan_status === 'trialing'
              ? ` · ${trialDaysLeft}d restantes`
              : ''}
          </span>
        }
      />

      <PlanStatusBanner professional={professional} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Próximas consultas"
          value={(upcomingCount ?? 0).toString()}
          hint="agendadas daqui pra frente"
        />
        <StatCard
          label="Pacientes cadastrados"
          value={(patientsCount ?? 0).toString()}
          hint="no seu cadastro central"
        />
        <StatCard
          label="Blocos semanais ativos"
          value={(weeklyBlocks ?? 0).toString()}
          hint="horários que a IA pode oferecer"
        />
      </section>

      {!availabilityConfigured && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Configure sua agenda
            </CardTitle>
            <CardDescription>
              Defina os horários em que você atende para que a IA possa agendar
              consultas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/configuracoes/disponibilidade"
              className={buttonVariants({ size: 'lg' })}
            >
              Configurar disponibilidade
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard
          eyebrow="Agenda"
          title="Agenda da semana"
          description="Visualize todos os agendamentos, incluindo os criados pela IA no WhatsApp."
          href="/agenda"
          cta="Abrir agenda"
        />
        <ActionCard
          eyebrow="Pacientes"
          title="Cadastro de pacientes"
          description="Cadastro central usado nos agendamentos manuais e no fluxo da IA."
          href="/pacientes"
          cta="Ver pacientes"
        />
        <ActionCard
          eyebrow="Configuração"
          title="Disponibilidade e exceções"
          description="Ajuste sua rotina semanal e bloqueie feriados ou dias atípicos."
          href="/configuracoes/disponibilidade"
          cta="Editar disponibilidade"
          secondary={{
            href: '/configuracoes/excecoes',
            label: 'Exceções',
          }}
        />
        <ActionCard
          eyebrow={professional.whatsapp_connected ? 'Conectado' : 'Ainda não conectado'}
          eyebrowTone={professional.whatsapp_connected ? 'success' : 'warning'}
          title="WhatsApp"
          description={
            professional.whatsapp_connected
              ? 'Sua secretária virtual está recebendo mensagens.'
              : 'A IA só responde depois que o WhatsApp for pareado.'
          }
          href="/configuracoes/whatsapp"
          cta={
            professional.whatsapp_connected
              ? 'Gerenciar conexão'
              : 'Conectar WhatsApp'
          }
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-5 ring-1 ring-foreground/5">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span
        className="font-display text-3xl font-semibold tracking-tight"
        style={{ letterSpacing: '-0.03em' }}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function ActionCard({
  eyebrow,
  eyebrowTone = 'default',
  title,
  description,
  href,
  cta,
  secondary,
}: {
  eyebrow: string;
  eyebrowTone?: 'default' | 'success' | 'warning';
  title: string;
  description: string;
  href: string;
  cta: string;
  secondary?: { href: string; label: string };
}) {
  const toneClass =
    eyebrowTone === 'success'
      ? 'text-emerald-600 dark:text-emerald-300'
      : eyebrowTone === 'warning'
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-primary';

  return (
    <Card className="group transition-colors hover:border-primary/30">
      <CardHeader>
        <span
          className={`font-mono text-[11px] uppercase tracking-[0.18em] ${toneClass}`}
        >
          {eyebrow}
        </span>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link href={href} className={buttonVariants({ variant: 'outline' })}>
          {cta}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className={buttonVariants({ variant: 'ghost' })}
          >
            {secondary.label}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
