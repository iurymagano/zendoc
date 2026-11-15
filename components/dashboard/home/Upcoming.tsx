import { isPersonalCommitment } from '@/lib/appointments/personal';
import { saoPauloParts } from '@/lib/assistant/datetime';
import type { UpcomingGroup } from '@/lib/dashboard/summary';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ApproveButton } from './ApproveButton';
import { OriginChip } from './chips';
import { EmptyState, PanelLink } from './Panel';

/**
 * Próximos atendimentos, agrupados por dia, no mesmo cartão da agenda: horário, cliente,
 * serviço, status e origem. Cada linha abre o dia na agenda; Confirmar fica nos agendados.
 */
export function Upcoming({
  groups,
  serviceNames,
}: {
  groups: UpcomingGroup[];
  serviceNames: Record<string, string>;
}) {
  return (
    <section aria-label="Próximos atendimentos" className="flex flex-col gap-3">
      <SectionHeader
        title="Próximos atendimentos"
        action={<PanelLink href="/agenda">Abrir agenda</PanelLink>}
      />
      {groups.length === 0 ? (
        <EmptyState
          title="Nenhum atendimento por vir."
          href="/agenda"
          cta="Marcar um atendimento"
          className="bg-card"
        >
          Assim que a IA marcar alguém pelo WhatsApp, ou você marcar na agenda, o horário aparece aqui.
        </EmptyState>
      ) : (
        groups.map((g) => (
          <div key={g.date} className="flex flex-col gap-1.5">
            <h3 className="px-1 text-[13px] font-semibold text-muted-foreground">{g.label}</h3>
            <ul className="flex flex-col gap-1.5">
              {g.items.map((a) => {
                const personal = isPersonalCommitment(a.patient_phone);
                const service = a.service_id ? serviceNames[a.service_id] : null;
                return (
                  <li key={a.id}>
                    <AppointmentCard
                      startsAt={a.starts_at}
                      endsAt={a.ends_at}
                      title={a.patient_name}
                      detail={personal ? 'Compromisso pessoal' : (service ?? 'Sem serviço definido')}
                      status={personal ? undefined : a.status}
                      href={`/agenda?date=${saoPauloParts(new Date(a.starts_at)).date}`}
                      badges={
                        <span className="hidden sm:contents">
                          <OriginChip via={a.booked_via} personal={personal} />
                        </span>
                      }
                      actions={
                        !personal && a.status === 'scheduled' ? (
                          <span className="hidden sm:block">
                            <ApproveButton id={a.id} mode="confirm" />
                          </span>
                        ) : undefined
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
