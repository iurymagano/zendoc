import { cn } from '@/lib/utils';

const DAYS = [
  { name: 'Seg', day: 16 },
  { name: 'Ter', day: 17 },
  { name: 'Qua', day: 18 },
  { name: 'Qui', day: 19 },
  { name: 'Sex', day: 20 },
];

// Sessões de 50 minutos dentro dos blocos de manhã (8h às 12h) e tarde (14h às 18h).
const MORNING = ['08:00', '08:50', '09:40', '10:30'];
const AFTERNOON = ['14:00', '14:50', '15:40', '16:30'];

// Horários já ocupados, por dia (índice em DAYS).
const TAKEN: Record<number, string[]> = {
  0: ['08:00', '09:40', '14:00', '15:40'],
  1: ['08:50', '14:50'],
  2: ['10:30', '14:00', '16:30'],
  3: ['08:00', '08:50', '15:40'],
  4: ['09:40', '14:50'],
};
const BOOKED_NOW = { day: 3, time: '14:00' };

function Slot({ dayIndex, time }: { dayIndex: number; time: string }) {
  const mine = dayIndex === BOOKED_NOW.day && time === BOOKED_NOW.time;
  const taken = TAKEN[dayIndex]?.includes(time);
  return (
    <li
      className={cn(
        'tabular flex h-9 items-center justify-center rounded-lg font-mono text-[12px] sm:text-[13px]',
        mine && 'bg-primary font-semibold text-primary-foreground',
        !mine && taken && 'bg-muted text-muted-foreground line-through decoration-1',
        !mine && !taken && 'bg-[#e8e1ff] font-medium text-[#3d2399]',
      )}
      aria-label={`${time}, ${mine ? 'marcado agora' : taken ? 'ocupado' : 'livre'}`}
    >
      {time}
    </li>
  );
}

function Block({ label, range, times }: { label: string; range: string; times: string[] }) {
  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
        {label}
        <span className="tabular font-mono text-xs font-normal text-muted-foreground">{range}</span>
      </p>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {DAYS.map((d, di) => (
          <ul key={d.name} className="flex flex-col gap-1.5 sm:gap-2">
            {times.map((t) => (
              <Slot key={t} dayIndex={di} time={t} />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** A semana como a secretária enxerga: livre, ocupado, e o almoço que nunca é oferecido. */
export function WeekGrid() {
  return (
    <div className="rounded-3xl bg-card p-4 sm:p-7" role="group" aria-label="Exemplo de agenda da semana de 16 a 20 de novembro">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {DAYS.map((d) => (
          <p key={d.name} className="text-center leading-tight">
            <span className="block text-sm font-semibold">{d.name}</span>
            <span className="tabular block text-xs text-muted-foreground">{d.day}/11</span>
          </p>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <Block label="Manhã" range="08:00 a 12:00" times={MORNING} />
        <div
          className="flex h-11 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
        >
          Almoço: a secretária não oferece
        </div>
        <Block label="Tarde" range="14:00 a 18:00" times={AFTERNOON} />
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <li className="flex items-center gap-2"><span className="size-3 rounded bg-[#e8e1ff]" />Livre, a secretária oferece</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded bg-muted ring-1 ring-border" />Ocupado</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded bg-primary" />Marcado agora pela Marina</li>
      </ul>
    </div>
  );
}
