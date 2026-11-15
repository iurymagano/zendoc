import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { loadDashboard } from '@/lib/dashboard/load';
import { firstNameSkippingTitle } from '@/lib/name';
import { PlanStatusBanner } from '@/components/billing/PlanStatusBanner';
import { PageContainer } from '@/components/layout/PageContainer';
import { TrialStrip, WhatsAppAlert } from '@/components/dashboard/home/Alerts';
import { Attention } from '@/components/dashboard/home/Attention';
import { Conversations } from '@/components/dashboard/home/Conversations';
import { DashboardHeader } from '@/components/dashboard/home/DashboardHeader';
import { FreeSlots } from '@/components/dashboard/home/FreeSlots';
import { Metrics } from '@/components/dashboard/home/Metrics';
import { SetupCard, SetupHero } from '@/components/dashboard/home/SetupChecklist';
import { StatusCard } from '@/components/dashboard/home/StatusCard';
import { TodayPanel } from '@/components/dashboard/home/TodayPanel';
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
  const setupCardShown = !data.isNew && !setup.complete;

  return (
    <PageContainer variant="wide" className="gap-4 sm:gap-5">
      {/* Cobrança e conexão primeiro: é o que mais atrapalha o resto. */}
      {!trialRunning && <PlanStatusBanner professional={professional} />}
      {/* Com o passo a passo na tela o WhatsApp já é o primeiro passo: o alerta só repetiria. */}
      {!professional.whatsapp_connected && !data.isNew && !setupCardShown && <WhatsAppAlert />}

      {data.isNew ? (
        <>
          <SetupHero setup={setup} firstName={firstName} />
          {trialRunning && trial && <TrialStrip trial={trial} />}
        </>
      ) : (
        <>
          <DashboardHeader data={data} firstName={firstName} />
          {trialRunning && trial && <TrialStrip trial={trial} />}
          <Metrics data={data} whatsappConnected={professional.whatsapp_connected} />

          {/* No celular as colunas somem (display: contents) e `order` define a fila:
              o que precisa de ação e o que vem a seguir antes do resto. */}
          <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <div className="contents lg:flex lg:flex-col lg:gap-5">
              <div className="order-1">
                <Upcoming groups={data.upcoming} serviceNames={data.serviceNames} />
              </div>
              <div className="order-2 empty:hidden">
                <Attention
                  pending={data.pending}
                  pendingCount={data.pendingCount}
                  needsReply={data.needsReply}
                  paused={data.paused}
                  now={now}
                />
              </div>
              <div className="order-5">
                <TodayPanel data={data} />
              </div>
              <div className="order-7">
                <FreeSlots slots={data.slots} availabilityConfigured={data.availabilityConfigured} now={now} />
              </div>
              <div className="order-8">
                <Conversations
                  items={data.recent}
                  now={now}
                  whatsappConnected={professional.whatsapp_connected}
                />
              </div>
            </div>
            <div className="contents lg:flex lg:flex-col lg:gap-5">
              <div className="order-3">
                <StatusCard
                  data={data}
                  aiEnabled={professional.ai_enabled}
                  whatsappConnected={professional.whatsapp_connected}
                />
              </div>
              {setupCardShown && (
                <div className="order-4">
                  <SetupCard setup={setup} />
                </div>
              )}
              <div className="order-6">
                <WeekPanel data={data} />
              </div>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
