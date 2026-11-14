import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { declarationEligibility } from '@/lib/appointments/declaration';
import { PrintButton } from '@/components/documents/PrintButton';
import { buttonVariants } from '@/components/ui/button';
import type { Appointment, Professional } from '@/types/database';

const TZ = 'America/Sao_Paulo';

function longDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function time(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Declaração de comparecimento (imprimível). Gerada a partir de um appointment
 * do profissional logado. Rota fora do grupo (dashboard) — sem navbar, layout
 * limpo pra impressão/PDF (window.print()).
 *
 * Só emite o documento se o atendimento já começou e não foi cancelado nem
 * marcado como falta (declarationEligibility): o texto afirma que o cliente
 * "compareceu". Caso contrário mostra um aviso no lugar do documento.
 */
export default async function DeclaracaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const supabase = createServerClient();

  const { data: professional } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle<Professional>();
  if (!professional) redirect('/onboarding/step-1');

  const { data: appointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('professional_id', professional.id)
    .maybeSingle<Appointment>();
  if (!appointment) notFound();

  const eligibility = declarationEligibility(appointment);
  if (!eligibility.ok) {
    return (
      <div className="min-h-screen bg-[var(--ia-mist)] px-4 py-8">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <h1 className="font-display text-lg font-semibold">
            Declaração de comparecimento
          </h1>
          <div
            role="status"
            className="rounded-2xl bg-white p-6 text-sm leading-relaxed ring-1 ring-border"
          >
            <p className="font-medium">{eligibility.message}</p>
            <p className="mt-2 text-muted-foreground">
              Volte à agenda e gere a declaração depois que o atendimento
              acontecer.
            </p>
          </div>
          <div>
            <Link href="/agenda" className={buttonVariants({ variant: 'outline' })}>
              Voltar para a agenda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const emitidoEm = longDate(new Date().toISOString());

  return (
    <div className="min-h-screen bg-[var(--ia-mist)] px-4 py-8 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="font-display text-lg font-semibold">
            Declaração de comparecimento
          </h1>
          <PrintButton backHref="/agenda" />
        </div>

        {/* Documento */}
        <article className="mx-auto w-full bg-white p-12 text-[#0a0a0f] rounded-2xl ring-1 ring-border print:rounded-none print:p-0 print:ring-0">
          <header className="mb-10 text-center">
            <h2 className="font-display text-xl font-bold tracking-tight">
              {professional.name}
            </h2>
            {professional.specialty && (
              <p className="text-sm text-[#4b5563]">
                {professional.specialty}
              </p>
            )}
            {professional.address && (
              <p className="mt-1 text-xs text-[#4b5563]">
                {professional.address}
              </p>
            )}
          </header>

          <h3 className="mb-8 text-center text-base font-semibold uppercase tracking-[0.12em]">
            Declaração de comparecimento
          </h3>

          <p className="text-justify leading-[1.9]">
            Declaro, para os devidos fins, que{' '}
            <strong>{appointment.patient_name}</strong> compareceu a atendimento
            com <strong>{professional.name}</strong> no dia <strong>{longDate(appointment.starts_at)}</strong>
            , no horário das <strong>{time(appointment.starts_at)}</strong> às{' '}
            <strong>{time(appointment.ends_at)}</strong>.
          </p>

          <p className="mt-12 text-right">{emitidoEm}.</p>

          <div className="mt-16 flex flex-col items-center">
            <div className="w-72 border-t border-[#0a0a0f]" />
            <p className="mt-2 text-sm font-medium">{professional.name}</p>
            {professional.specialty && (
              <p className="text-xs text-[#4b5563]">
                {professional.specialty}
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
