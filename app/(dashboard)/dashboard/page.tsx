import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { loadDashboard } from '@/lib/dashboard/load';
import { firstNameSkippingTitle } from '@/lib/name';
import { PlanStatusBanner } from '@/components/billing/PlanStatusBanner';
import { TrialStrip, WhatsAppAlert } from '@/components/dashboard/home/Alerts';
import { Attention } from '@/components/dashboard/home/Attention';
import { Conversations } from '@/components/dashboard/home/Conversations';
import { FreeSlots } from '@/components/dashboard/home/FreeSlots';
import { Hero } from '@/components/dashboard/home/Hero';
import { SetupCard, SetupHero } from '@/components/dashboard/home/SetupChecklist';
import { Upcoming } from '@/components/dashboard/home/Upcoming';
import { WeekPanel } from '@/components/dashboard/home/WeekPanel';
import type { Professional } from '@/types/database';

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

  const data = await loadDashboard(professional);
  const firstName = firstNameSkippingTitle(professional.name);
  const { now, setup, trial } = data;
  const trialRunning = !!trial && !trial.ended;
  // O passo a passo deixa a coluna da direita comprida: nesse caso "Sua semana" vai
  // para a esquerda e as duas colunas fecham na mesma altura. Sem passo a passo, volta
  // para a direita (a esquerda já tem próximos e conversas).
  const setupCardShown = !data.isNew && !setup.complete;
  const week = (
    <div className="order-4">
      <WeekPanel data={data} />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Cobrança e conexão primeiro: é o que mais atrapalha o resto. */}
      {!trialRunning && <PlanStatusBanner professional={professional} />}
      {!professional.whatsapp_connected && !data.isNew && <WhatsAppAlert />}

      {data.isNew ? <SetupHero setup={setup} firstName={firstName} /> : <Hero data={data} firstName={firstName} />}

      {/* O teste grátis vem depois do dia: avisar não pode empurrar o que é de hoje. */}
      {trialRunning && trial && <TrialStrip trial={trial} />}

      {/* No celular as colunas somem (display: contents) e `order` define a fila:
          o que precisa de ação e o que vem a seguir antes dos números. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <div className="order-1 empty:hidden">
            <Attention
              pending={data.pending}
              pendingCount={data.pendingCount}
              needsReply={data.needsReply}
              paused={data.paused}
              now={now}
            />
          </div>
          <div className="order-2">
            <Upcoming groups={data.upcoming} serviceNames={data.serviceNames} />
          </div>
          {setupCardShown && week}
          <div className="order-6">
            <Conversations items={data.recent} now={now} />
          </div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          {setupCardShown && (
            <div className="order-3">
              <SetupCard setup={setup} />
            </div>
          )}
          {!setupCardShown && week}
          <div className="order-5">
            <FreeSlots slots={data.slots} availabilityConfigured={data.availabilityConfigured} now={now} />
          </div>
        </div>
      </div>
    </div>
  );
}
