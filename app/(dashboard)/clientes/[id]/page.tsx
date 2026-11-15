import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerClient } from '@/lib/supabase';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatPhoneBR } from '@/lib/phone';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatusBadge } from '@/components/appointments/StatusBadge';
import type {
  Appointment,
  BookedVia,
  Patient,
} from '@/types/database';

const TZ = 'America/Sao_Paulo';

const SOURCE_LABEL: Record<BookedVia, string> = {
  whatsapp_ai: 'IA no WhatsApp',
  manual: 'Manual',
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function AppointmentItem({ appointment }: { appointment: Appointment }) {
  const faded =
    appointment.status === 'cancelled' || appointment.status === 'no_show';
  return (
    <li
      className={`flex flex-col gap-1 py-3 ${faded ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium tabular-nums">
          {formatDateTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="text-xs text-muted-foreground">
        {SOURCE_LABEL[appointment.booked_via]}
        {appointment.notes ? ` · ${appointment.notes}` : ''}
        {appointment.cancellation_note
          ? ` · motivo: ${appointment.cancellation_note}`
          : ''}
      </div>
    </li>
  );
}

export default async function PatientDetailPage({
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
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) redirect('/onboarding/step-1');

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('professional_id', professional.id)
    .maybeSingle<Patient>();

  if (!patient) notFound();

  const { data: appointmentsData } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', id)
    .eq('professional_id', professional.id)
    .order('starts_at', { ascending: false });

  const appointments = (appointmentsData ?? []) as Appointment[];
  const now = new Date();
  const upcoming = appointments
    .filter(
      (a) =>
        new Date(a.starts_at) >= now &&
        ['scheduled', 'confirmed', 'pending_approval'].includes(a.status),
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const past = appointments.filter(
    (a) =>
      new Date(a.starts_at) < now ||
      ['cancelled', 'no_show'].includes(a.status),
  );

  const registered = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(patient.created_at));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={patient.name}
        description={`${formatPhoneBR(patient.phone)} · cadastrado em ${registered}`}
        actions={
          <>
            <Link
              href="/clientes"
              className={buttonVariants({ variant: 'ghost' })}
            >
              ← Clientes
            </Link>
            <Link
              href="/agenda"
              className={buttonVariants({ variant: 'outline' })}
            >
              Novo agendamento
            </Link>
            <a
              href={`/api/patients/${patient.id}/export`}
              className={buttonVariants({ variant: 'ghost' })}
              title="Exportar todos os dados deste cliente (LGPD)"
            >
              Exportar dados
            </a>
          </>
        }
      />

        {patient.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Anotações clínicas</CardTitle>
              <CardDescription>
                Notas privadas visíveis apenas para você.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {patient.notes}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Próximos atendimentos</CardTitle>
            <CardDescription>
              {upcoming.length === 0
                ? 'Sem atendimentos marcados.'
                : `${upcoming.length} atendimento${upcoming.length === 1 ? '' : 's'} futuro${upcoming.length === 1 ? '' : 's'}.`}
            </CardDescription>
          </CardHeader>
          {upcoming.length > 0 && (
            <CardContent>
              <ul className="flex flex-col divide-y">
                {upcoming.map((a) => (
                  <AppointmentItem key={a.id} appointment={a} />
                ))}
              </ul>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              {past.length === 0
                ? 'Nenhum atendimento anterior registrado.'
                : `${past.length} atendimento${past.length === 1 ? '' : 's'} no histórico (mais recentes primeiro).`}
            </CardDescription>
          </CardHeader>
          {past.length > 0 && (
            <CardContent>
              <ul className="flex flex-col divide-y">
                {past.map((a) => (
                  <AppointmentItem key={a.id} appointment={a} />
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
    </div>
  );
}
