import Link from 'next/link';
import { formatPhoneBR } from '@/lib/phone';
import type { ConversationItem } from '@/lib/dashboard/load';
import { relativeTime, snippet } from '@/lib/dashboard/summary';
import { EmptyState, Panel } from './Panel';

/** Últimas conversas do WhatsApp, uma linha por cliente. */
export function Conversations({
  items,
  now,
  whatsappConnected,
}: {
  items: ConversationItem[];
  now: Date;
  whatsappConnected: boolean;
}) {
  return (
    <Panel
      label="WhatsApp"
      title="Conversas recentes"
      action={
        <Link href="/conversas" className="text-sm font-medium text-[var(--ia-violet-ink)] underline underline-offset-4">
          Ver todas
        </Link>
      }
    >
      {items.length === 0 ? (
        whatsappConnected ? (
          <EmptyState title="Nenhuma conversa ainda." href="/configuracoes/testar-ia" cta="Testar a IA">
            Quando um cliente escrever no seu WhatsApp, a conversa com a IA aparece aqui.
          </EmptyState>
        ) : (
          <EmptyState title="Nenhuma conversa ainda." href="/configuracoes/whatsapp" cta="Conectar WhatsApp">
            Conecte o WhatsApp e, quando um cliente escrever, a conversa com a IA aparece aqui.
          </EmptyState>
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.phone} className="flex flex-col gap-0.5 rounded-2xl bg-background px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-medium">{c.name ?? formatPhoneBR(c.phone)}</p>
                {c.last_at && (
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {relativeTime(c.last_at, now)}
                  </span>
                )}
              </div>
              {c.last_message && (
                <p className="truncate text-sm text-muted-foreground">
                  {c.last_role === 'assistant' ? 'IA: ' : ''}
                  {snippet(c.last_message, 90)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
