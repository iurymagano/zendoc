'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';

type UiStatus =
  | 'loading'
  | 'not_provisioned'
  | 'waiting_scan'
  | 'connected'
  | 'error';

const POLL_INTERVAL_MS = 3000;

function normalizeQr(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;
  return `data:image/png;base64,${raw}`;
}

type StatusPayload = {
  provisioned: boolean;
  connected: boolean;
  qrcode: string | null;
};

export default function WhatsAppConfigPage() {
  const [status, setStatus] = useState<UiStatus>('loading');
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const body = (await res.json().catch(() => ({}))) as Partial<StatusPayload> & {
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? 'Erro ao consultar o status do WhatsApp.');
        setStatus('error');
        stopPolling();
        return;
      }
      if (!body.provisioned) {
        setQrcode(null);
        setStatus('not_provisioned');
        stopPolling();
        return;
      }
      if (body.connected) {
        setQrcode(null);
        setStatus('connected');
        stopPolling();
        return;
      }
      setQrcode(body.qrcode ?? null);
      setStatus('waiting_scan');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => {
    (async () => {
      await fetchStatus();
    })();
    return () => stopPolling();
  }, [fetchStatus, stopPolling]);

  useEffect(() => {
    if (status !== 'waiting_scan') return;
    stopPolling();
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => stopPolling();
  }, [status, fetchStatus, stopPolling]);

  async function onConnect() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as {
        qrcode?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? 'Não foi possível iniciar a conexão.');
        setStatus('error');
        return;
      }
      setQrcode(body.qrcode ?? null);
      setStatus('waiting_scan');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    stopPolling();
    setStatus('loading');
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Não foi possível desconectar o WhatsApp.');
        setStatus('error');
        return;
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  async function onDisconnect() {
    const ok = window.confirm(
      'Desconectar WhatsApp? A IA parará de responder as mensagens dos seus clientes.',
    );
    if (!ok) return;
    await disconnect();
  }

  // Cancela o pareamento em andamento (QR nunca escaneado): remove a instância
  // pendurada na Evolution e volta para "Conectar WhatsApp". Sem confirmação —
  // não há nada conectado a perder.
  async function onCancel() {
    await disconnect();
  }

  const qrSrc = normalizeQr(qrcode);

  const statusBadge =
    status === 'connected'
      ? {
          label: 'Conectado',
          tone: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900/60',
        }
      : status === 'waiting_scan'
        ? {
            label: 'Aguardando scan',
            tone: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-900/60',
          }
        : status === 'not_provisioned'
          ? {
              label: 'Pendente',
              tone: 'bg-muted text-muted-foreground ring-border',
            }
          : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="WhatsApp"
        description="Conecte seu WhatsApp para que a IA responda seus clientes automaticamente, 24h por dia."
        actions={
          statusBadge ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusBadge.tone}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusBadge.label}
            </span>
          ) : null
        }
      />

        {status === 'loading' && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Carregando status da conexão…
            </CardContent>
          </Card>
        )}

        {status === 'not_provisioned' && (
          <Card>
            <CardHeader>
              <CardTitle>Conectar seu WhatsApp</CardTitle>
              <CardDescription>
                Clique para gerar o QR Code e parear o número que você usa para atender.
                A partir daí a secretária virtual responde seus clientes
                automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onConnect} disabled={connecting}>
                {connecting ? 'Gerando QR Code…' : 'Conectar WhatsApp'}
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'connected' && (
          <Card className="border-emerald-500/40">
            <CardHeader>
              <CardTitle>WhatsApp conectado</CardTitle>
              <CardDescription>
                A secretária virtual está ativa e respondendo suas mensagens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={onDisconnect}>
                Desconectar WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'waiting_scan' && qrSrc && (
          <Card>
            <CardHeader>
              <CardTitle>Escaneie o QR Code</CardTitle>
              <CardDescription>
                Abra o WhatsApp → Dispositivos conectados → Conectar um
                dispositivo e aponte a câmera para o código abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="QR Code para conectar WhatsApp"
                className="w-64 h-64 rounded-lg border bg-white p-2"
              />
              <p className="text-xs text-muted-foreground text-center">
                Aguardando leitura… a tela atualiza automaticamente a cada 3
                segundos. O QR é renovado periodicamente.
              </p>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'waiting_scan' && !qrSrc && (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 py-6 text-sm text-muted-foreground">
              Buscando QR Code…
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'error' && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Não foi possível conectar</CardTitle>
              <CardDescription>
                {error ?? 'Erro desconhecido ao conectar o WhatsApp.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchStatus}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
