import Link from 'next/link';
import { formatBrDate, formatTime, saoPauloParts } from '@/lib/assistant/datetime';
import { Panel } from './Panel';

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
    <Panel label="Vagas" title="A IA oferece estes horários">
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
        <div className="rounded-2xl bg-background p-5 text-sm leading-relaxed">
          <p className="font-medium">
            {availabilityConfigured ? 'Sem vagas nos próximos 14 dias.' : 'Nenhum horário definido ainda.'}
          </p>
          <p className="mt-1 text-muted-foreground">
            {availabilityConfigured
              ? 'Sua agenda está cheia ou bloqueada. Abra novos horários para a IA voltar a marcar.'
              : 'Diga quando você atende e a IA passa a oferecer esses horários aos seus clientes.'}
          </p>
          <Link
            href="/configuracoes/disponibilidade"
            className="mt-3 inline-flex min-h-11 items-center font-medium text-[var(--ia-violet-ink)] underline underline-offset-4"
          >
            {availabilityConfigured ? 'Ajustar horários' : 'Definir horários'}
          </Link>
        </div>
      )}
    </Panel>
  );
}
