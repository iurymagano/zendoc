import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('name, specialty, plan_status, trial_ends_at, whatsapp_connected')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) redirect('/onboarding/step-1');

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Olá, {professional.name}
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          {professional.specialty} · plano: {professional.plan_status}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">WhatsApp</h2>
            <p className="text-sm text-zinc-600 mt-1">
              {professional.whatsapp_connected
                ? 'Conectado'
                : 'Ainda não conectado. Configure na próxima sprint.'}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Trial</h2>
            <p className="text-sm text-zinc-600 mt-1">
              {professional.trial_ends_at
                ? `Termina em ${new Date(professional.trial_ends_at).toLocaleDateString('pt-BR')}`
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
