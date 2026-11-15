import Link from 'next/link';
import { formatBrDateTime } from '@/lib/assistant/datetime';
import { formatPhoneBR } from '@/lib/phone';
import type { ConversationItem } from '@/lib/dashboard/load';
import { relativeTime, snippet, type DashAppointment } from '@/lib/dashboard/summary';
import { buttonVariants } from '@/components/ui/button';
import { ApproveButton } from './ApproveButton';
import { Panel } from './Panel';

const who = (c: ConversationItem) => c.name ?? formatPhoneBR(c.phone);

/**
 * "Precisam de você": o que a IA não resolve sozinha. Pedidos esperando aprovação,
 * conversas em que a IA pediu ajuda e conversas que você pausou. Some se não há nada.
 */
export function Attention({
  pending,
  pendingCount,
  needsReply,
  paused,
  now,
}: {
  pending: DashAppointment[];
  pendingCount: number;
  needsReply: ConversationItem[];
  paused: ConversationItem[];
  now: Date;
}) {
  const total = pendingCount + needsReply.length + paused.length;
  if (total === 0) return null;

  return (
    <Panel label="Atenção" title={`${total} ${total === 1 ? 'coisa precisa' : 'coisas precisam'} de você`}>
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Aguardam sua aprovação{pendingCount > pending.length ? ` · ${pendingCount}` : ''}
          </h3>
          <ul className="flex flex-col gap-2">
            {pending.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-2 rounded-2xl bg-[var(--warning-soft)] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--warning)]">{a.patient_name}</p>
                  <p className="font-mono text-sm tabular-nums text-[var(--warning)]">
                    {formatBrDateTime(a.starts_at, now)}
                  </p>
                </div>
                <ApproveButton id={a.id} mode="approve" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {[
        { title: 'A IA pediu sua ajuda', list: needsReply, cta: 'Responder' },
        { title: 'Conversas pausadas por você', list: paused, cta: 'Abrir' },
      ]
        .filter((g) => g.list.length > 0)
        .map((g) => (
          <div key={g.title} className="flex flex-col gap-2">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {g.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {g.list.slice(0, 3).map((c) => (
                <li
                  key={c.phone}
                  className="flex flex-col gap-2 rounded-2xl bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{who(c)}</p>
                    {c.last_message && (
                      <p className="truncate text-sm text-muted-foreground">
                        {snippet(c.last_message, 70)}
                        {c.last_at && ` · ${relativeTime(c.last_at, now)}`}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/conversas"
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'min-h-11 sm:min-h-8' })}
                  >
                    {g.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </Panel>
  );
}
