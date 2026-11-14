import type { ComponentType } from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CalendarDays, Clock, MessageSquare, Users } from 'lucide-react';
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
import { firstNameSkippingTitle } from '@/lib/name';
import { PageHeader } from '@/components/dashboard/PageHeader';
import type { Professional, PlanStatus } from '@/types/database';

const PLAN_LABEL: Record<PlanStatus, string> = {
  trialing: 'Trial',
  active: 'Ativo',
  past_due: 'Em atraso',
  cancelled: 'Cancelado',
};

const PLAN_STYLE: Record<PlanStatus, string> = {
  trialing: 'bg-accent text-accent-foreground',
  active: 'bg-[var(--success-soft)] text-[var(--success)]',
  past_due: 'bg-[var(--destructive-soft)] text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
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
        title={`Olá, ${firstNameSkippingTitle(professional.name)}`}
        description={
          professional.specialty
            ? `${professional.specialty} · gerencie sua agenda e sua secretária virtual.`
            : 'Gerencie sua agenda e sua secretária virtual.'
        }
        actions={
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${PLAN_STYLE[professional.plan_status]}`}
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
          label="Próximos atendimentos"
          value={(upcomingCount ?? 0).toString()}
          hint="agendados daqui para a frente"
          icon={CalendarDays}
        />
        <StatCard
          label="Clientes cadastrados"
          value={(patientsCount ?? 0).toString()}
          hint="no seu cadastro central"
          icon={Users}
        />
        <StatCard
          label="Blocos semanais ativos"
          value={(weeklyBlocks ?? 0).toString()}
          hint="horários que a IA pode oferecer"
          icon={Clock}
        />
      </section>

      {!availabilityConfigured && (
        <Card className="bg-accent ring-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configure sua agenda
            </CardTitle>
            <CardDescription>
              Defina os horários em que você atende para que a IA possa agendar
              atendimentos automaticamente.
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
          icon={CalendarDays}
        />
        <ActionCard
          eyebrow="Clientes"
          title="Cadastro de clientes"
          description="Cadastro central usado nos agendamentos manuais e no fluxo da IA."
          href="/clientes"
          cta="Ver clientes"
          icon={Users}
        />
        <ActionCard
          eyebrow="Configuração"
          title="Disponibilidade e exceções"
          description="Ajuste sua rotina semanal e bloqueie feriados ou dias atípicos."
          href="/configuracoes/disponibilidade"
          cta="Editar disponibilidade"
          icon={Clock}
          secondary={{
            href: '/configuracoes/excecoes',
            label: 'Exceções',
          }}
        />
        <ActionCard
          eyebrow={professional.whatsapp_connected ? 'Conectado' : 'Ainda não conectado'}
          eyebrowTone={professional.whatsapp_connected ? 'success' : 'warning'}
          icon={MessageSquare}
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
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card p-5 ring-1 ring-border">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="tabular font-display text-5xl font-bold leading-none tracking-[-0.04em]">
        {value}
      </span>
      {hint && <span className="mt-1 text-sm text-muted-foreground">{hint}</span>}
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
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  cta: string;
  secondary?: { href: string; label: string };
}) {
  const toneClass =
    eyebrowTone === 'success'
      ? 'bg-[var(--success-soft)] text-[var(--success)]'
      : eyebrowTone === 'warning'
        ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
        : 'text-[var(--ia-violet-ink)]';

  return (
    <Card>
      <CardHeader>
        <span
          className={`w-fit text-sm font-semibold ${
            eyebrowTone === 'default' ? toneClass : `rounded-full px-2.5 py-0.5 ${toneClass}`
          }`}
        >
          {eyebrow}
        </span>
        <CardTitle className="mt-1 font-display text-xl font-bold tracking-[-0.03em]">
          {title}
        </CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
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
