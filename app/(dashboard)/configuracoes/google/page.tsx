'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';

type Status = {
  connected: boolean;
  email: string | null;
  calendarId: string;
  pushActive: boolean;
};

const ERROR_LABELS: Record<string, string> = {
  no_refresh_token:
    'O Google não devolveu uma autorização permanente. Revogue o acesso do IAzen em myaccount.google.com/permissions e tente conectar de novo.',
  invalid_state: 'A sessão de conexão expirou. Tente novamente.',
  exchange_failed: 'Não foi possível concluir a autorização com o Google.',
  unauthorized: 'Faça login novamente para conectar o Google.',
  forbidden: 'Essa conexão não pertence ao seu perfil.',
  access_denied: 'Você cancelou a autorização no Google.',
};

function GoogleCalendarSettings() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const justConnected = searchParams.get('connected') === '1';
  const errorCode = searchParams.get('error');

  async function loadStatus() {
    setLoading(true);
    const res = await fetch('/api/google/calendar/status');
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await loadStatus();
    })();
  }, []);

  function connect() {
    window.location.href = '/api/google/calendar/connect';
  }

  async function disconnect() {
    if (!window.confirm('Desconectar o Google Agenda? Os eventos pessoais importados deixarão de bloquear horários.')) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/google/calendar/disconnect', { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      setMessage('Google Agenda desconectado.');
      await loadStatus();
    } else {
      setMessage('Erro ao desconectar.');
    }
  }

  async function syncNow() {
    setBusy(true);
    setMessage(null);
    const res = await fetch('/api/google/calendar/sync', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMessage(
        `Sincronizado: ${body.upserted ?? 0} evento(s) importado(s), ${body.removed ?? 0} removido(s).`,
      );
      await loadStatus();
    } else {
      setMessage(body.error ?? 'Erro ao sincronizar.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Integrações"
        title="Google Agenda"
        description="Sincronize seus agendamentos do IAzen com o Google Calendar — em mão dupla."
      />

      {justConnected && (
        <Card className="border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-200">
            Google Agenda conectado com sucesso. Seus agendamentos já estão sendo
            espelhados.
          </CardContent>
        </Card>
      )}

      {errorCode && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            {ERROR_LABELS[errorCode] ?? `Erro: ${errorCode}`}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conexão</CardTitle>
          <CardDescription>
            Conecte a conta Google do consultório. O IAzen cria/atualiza um evento
            no seu Google Agenda para cada consulta, e lê seus compromissos
            pessoais para bloquear esses horários na disponibilidade da IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : status?.connected ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900/60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Conectado
                </span>
                {status.email && (
                  <span className="text-muted-foreground">{status.email}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {status.pushActive
                  ? 'Sincronização automática ativa (push do Google).'
                  : 'A agenda sincroniza sozinha ao ser aberta (e a cada minuto). Use "Sincronizar agora" se quiser forçar na hora.'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={syncNow} disabled={busy}>
                  {busy ? 'Sincronizando…' : 'Sincronizar agora'}
                </Button>
                <Button variant="outline" onClick={disconnect} disabled={busy}>
                  Desconectar
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Nenhuma conta Google conectada.
              </p>
              <div>
                <Button onClick={connect}>Conectar Google Agenda</Button>
              </div>
            </>
          )}
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleCalendarPage() {
  return (
    <Suspense fallback={<div className="h-32" />}>
      <GoogleCalendarSettings />
    </Suspense>
  );
}
