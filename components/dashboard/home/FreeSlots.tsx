import { formatBrDate, formatTime, saoPauloParts } from '@/lib/assistant/datetime';
import { EmptyState, Panel } from './Panel';

/** Os próximos horários livres: o que a IA oferece a quem pedir hoje. */
export function FreeSlots({
  slots,
  availabilityConfigured,
  now,
}: {
  slots: { start: string; end: string }[];
  availabilityConfigured: boolean;
  now: Date;
}) {
  return (
    <Panel title="Vagas que a IA oferece" description="Os próximos horários livres, a partir de amanhã.">
      {slots.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <li
              key={s.start}
              className="rounded-full bg-background px-3.5 py-2 text-sm font-medium"
            >
              <span className="text-muted-foreground">{formatBrDate(saoPauloParts(new Date(s.start)).date, now)}</span>{' '}
              <span className="font-mono tabular-nums">{formatTime(s.start)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={availabilityConfigured ? 'Sem vagas nos próximos 14 dias.' : 'Nenhum horário definido ainda.'}
          href="/configuracoes/disponibilidade"
          cta={availabilityConfigured ? 'Ajustar horários' : 'Definir horários'}
        >
          {availabilityConfigured
            ? 'Sua agenda está cheia ou bloqueada. Abra novos horários para a IA voltar a marcar.'
            : 'Diga quando você atende e a IA passa a oferecer esses horários aos seus clientes.'}
        </EmptyState>
      )}
    </Panel>
  );
}
