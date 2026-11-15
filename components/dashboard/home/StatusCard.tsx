import Link from 'next/link';
import { CircleAlert, CircleCheck } from 'lucide-react';
import type { DashboardData } from '@/lib/dashboard/load';
import { cn } from '@/lib/utils';
import { Panel } from './Panel';

function Row({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <li className="flex min-h-9 items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3 font-medium">
        {children}
        {action && (
          <Link
            href={action.href}
            className="rounded-sm text-[var(--ia-violet-ink)] underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {action.label}
          </Link>
        )}
      </span>
    </li>
  );
}

/**
 * Estado da secretária em três linhas: a IA (ligada ou pausada), o WhatsApp e o que
 * espera por você. Sempre com texto: a cor e o ponto só reforçam. Cada linha com
 * problema traz o link para resolver.
 */
export function StatusCard({
  data,
  aiEnabled,
  whatsappConnected,
}: {
  data: DashboardData;
  aiEnabled: boolean;
  whatsappConnected: boolean;
}) {
  const waiting = data.pendingCount + data.needsReply.length + data.paused.length;
  return (
    <Panel
      title="Sua secretária"
      description={
        aiEnabled && whatsappConnected
          ? 'Atendendo seus clientes no WhatsApp.'
          : 'Ela só atende com a IA ligada e o WhatsApp conectado.'
      }
    >
      <ul className="flex flex-col divide-y divide-secondary">
        <Row label="IA">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'size-2 rounded-full',
                aiEnabled ? 'ia-spark bg-[var(--ia-spark)] ring-1 ring-[var(--success)]' : 'bg-muted-foreground',
              )}
            />
            {aiEnabled ? 'Ligada' : 'Pausada'}
          </span>
        </Row>
        <Row
          label="WhatsApp"
          action={whatsappConnected ? undefined : { href: '/configuracoes/whatsapp', label: 'Conectar' }}
        >
          {whatsappConnected ? (
            <span className="flex items-center gap-1.5 text-[var(--success)]">
              <CircleCheck className="size-4" aria-hidden="true" />
              Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--warning)]">
              <CircleAlert className="size-4" aria-hidden="true" />
              Desconectado
            </span>
          )}
        </Row>
        <Row label="Esperando você" action={waiting > 0 ? { href: '#atencao', label: 'Ver' } : undefined}>
          {waiting > 0 ? (
            <span className="text-[var(--warning)]">{waiting}</span>
          ) : (
            <span>Nada pendente</span>
          )}
        </Row>
      </ul>
      <Link
        href="/configuracoes/whatsapp"
        className="self-start rounded-sm text-sm font-medium text-[var(--ia-violet-ink)] underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Ajustar nas configurações
      </Link>
    </Panel>
  );
}
