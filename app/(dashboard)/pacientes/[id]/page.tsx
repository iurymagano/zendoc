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
import { PageHeader } from '@/components/dashboard/PageHeader';
import type {
  Appointment,
  AppointmentStatus,
  BookedVia,
  Patient,
} from '@/types/database';

const TZ = 'America/Sao_Paulo';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  pending_approval: 'Aguardando aprovação',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  scheduled: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  confirmed:
    'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900/60',
  pending_approval:
    'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-900/60',
  cancelled: 'bg-muted text-muted-foreground ring-1 ring-border',
  no_show: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
};

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

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 13) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 12) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return raw;
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
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[appointment.status]}`}
        >
          {STATUS_LABEL[appointment.status]}
        </span>
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
        eyebrow="Paciente"
        title={patient.name}
        description={`${formatPhone(patient.phone)} · cadastrado em ${registered}`}
        actions={
          <>
            <Link
              href="/pacientes"
              className={buttonVariants({ variant: 'ghost' })}
            >
              ← Pacientes
            </Link>
            <Link
              href="/agenda"
              className={buttonVariants({ variant: 'outline' })}
            >
              Novo agendamento
            </Link>
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
            <CardTitle>Próximas consultas</CardTitle>
            <CardDescription>
              {upcoming.length === 0
                ? 'Sem consultas marcadas.'
                : `${upcoming.length} consulta${upcoming.length === 1 ? '' : 's'} futura${upcoming.length === 1 ? '' : 's'}.`}
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
                ? 'Nenhuma consulta anterior registrada.'
                : `${past.length} consulta${past.length === 1 ? '' : 's'} no histórico (mais recentes primeiro).`}
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
