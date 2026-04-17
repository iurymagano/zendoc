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

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const supabase = createServerClient();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, specialty, plan_status, trial_ends_at, whatsapp_connected')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!professional) redirect('/onboarding/step-1');

  const { count: weeklyBlocks } = await supabase
    .from('availability_weekly')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professional.id)
    .eq('is_active', true);

  const availabilityConfigured = (weeklyBlocks ?? 0) > 0;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold">Olá, {professional.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {professional.specialty} · plano: {professional.plan_status}
          </p>
        </header>

        {!availabilityConfigured && (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Configure sua agenda</CardTitle>
              <CardDescription>
                Defina os horários em que você atende para que a IA possa
                agendar consultas automaticamente.
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>
                {professional.whatsapp_connected
                  ? 'Conectado e recebendo mensagens.'
                  : 'Ainda não conectado. Configure na próxima sprint.'}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Trial</CardTitle>
              <CardDescription>
                {professional.trial_ends_at
                  ? `Termina em ${new Date(professional.trial_ends_at).toLocaleDateString('pt-BR')}`
                  : '—'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
