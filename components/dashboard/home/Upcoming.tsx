import Link from 'next/link';
import { formatTime } from '@/lib/assistant/datetime';
import { isPersonalCommitment } from '@/lib/appointments/personal';
import type { UpcomingGroup } from '@/lib/dashboard/summary';
import { ApproveButton } from './ApproveButton';
import { OriginChip, StatusChip } from './chips';
import { EmptyState, Panel } from './Panel';

/** Próximos atendimentos, agrupados por dia, com a origem e o status de cada um. */
export function Upcoming({
  groups,
  serviceNames,
}: {
  groups: UpcomingGroup[];
  serviceNames: Record<string, string>;
}) {
  return (
    <Panel
      label="Próximos"
      title="O que vem aí"
      action={
        <Link href="/agenda" className="text-sm font-medium text-[var(--ia-violet-ink)] underline underline-offset-4">
          Abrir agenda
        </Link>
      }
    >
      {groups.length === 0 ? (
        <EmptyState title="Nenhum atendimento por vir." href="/agenda" cta="Marcar um atendimento">
          Assim que a IA marcar alguém pelo WhatsApp, ou você marcar na agenda, o horário
            aparece aqui.
        </EmptyState>
      ) : (
        groups.map((g) => (
          <div key={g.date} className="flex flex-col gap-2">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {g.label}
            </h3>
            <ul className="flex flex-col gap-2">
              {g.items.map((a) => {
                const personal = isPersonalCommitment(a.patient_phone);
                const service = a.service_id ? serviceNames[a.service_id] : null;
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-2 rounded-2xl bg-background p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4"
                  >
                    <span className="font-mono text-base font-medium tabular-nums sm:w-14">
                      {formatTime(a.starts_at)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <p className="truncate font-medium">
                        {a.patient_name}
                        {service && <span className="font-normal text-muted-foreground"> · {service}</span>}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <OriginChip via={a.booked_via} personal={personal} />
                        {!personal && <StatusChip status={a.status} />}
                      </div>
                    </div>
                    {!personal && a.status === 'scheduled' && <ApproveButton id={a.id} mode="confirm" />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </Panel>
  );
}
