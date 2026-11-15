import type { DayRuler as Ruler } from '@/lib/dashboard/schedule';
import type { DashAppointment } from '@/lib/dashboard/summary';
import { isPersonalCommitment } from '@/lib/appointments/personal';

/** O único degradê do painel: o trecho do dia que já passou. */
const GRADIENT = 'bg-[linear-gradient(95deg,#A78BFF_0%,#7FD8F0_55%,#5EEAD4_100%)]';

/**
 * A régua do dia: do primeiro ao último horário do expediente, com a janela em que você
 * atende, cada atendimento como um bloco e "agora" marcado pela faísca. O que já passou
 * fica preenchido pelo degradê.
 */
export function DayRulerView({
  ruler,
  items,
  now,
  summary,
}: {
  ruler: Ruler;
  items: DashAppointment[];
  now: Date;
  /** Texto equivalente para leitor de tela. */
  summary: string;
}) {
  const byId = new Map(items.map((a) => [a.id, a]));
  const nowMs = now.getTime();
  // Com muitas horas, no celular só as pares ganham número.
  const sparse = ruler.ticks.length > 7;

  return (
    <div role="img" aria-label={summary} className="flex flex-col gap-2">
      <div className="relative h-14 overflow-hidden rounded-2xl bg-secondary">
        {ruler.windows.map((w, i) => (
          <div
            key={i}
            className="absolute inset-y-0 bg-[var(--ia-mist)]"
            style={{ left: `${w.left}%`, width: `${w.width}%` }}
          />
        ))}
        {ruler.segments.map((s) => {
          const a = byId.get(s.id);
          const personal = a ? isPersonalCommitment(a.patient_phone) : false;
          const past = a ? Date.parse(a.ends_at) <= nowMs : false;
          const tone = personal
            ? 'bg-foreground'
            : a?.status === 'pending_approval'
              ? 'bg-[var(--warning)]'
              : 'bg-primary';
          return (
            <div
              key={s.id}
              title={a ? `${a.patient_name}` : undefined}
              className={`absolute inset-y-2 rounded-lg ${tone} ${past ? 'opacity-40' : ''}`}
              style={{ left: `${s.left}%`, width: `${s.width}%` }}
            />
          );
        })}
        {ruler.nowPct !== null && (
          <div
            className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-foreground"
            style={{ left: `${ruler.nowPct}%` }}
          />
        )}
      </div>

      <div className="relative h-1.5 rounded-full bg-secondary">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${GRADIENT}`}
          style={{ width: `${ruler.elapsedPct}%` }}
        />
        {ruler.nowPct !== null && (
          <span
            className="ia-spark absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ia-spark)] ring-[3px] ring-card"
            style={{ left: `${ruler.nowPct}%` }}
          />
        )}
      </div>

      <div className="relative mt-1 h-4 font-mono text-[10px] tabular-nums text-muted-foreground">
        {ruler.ticks.map((t, i) => (
          <span
            key={t.hour}
            className={`absolute -translate-x-1/2 ${sparse && i % 2 === 1 ? 'max-sm:hidden' : ''}`}
            style={{ left: `${t.left}%` }}
          >
            {String(t.hour).padStart(2, '0')}h
          </span>
        ))}
      </div>
    </div>
  );
}
