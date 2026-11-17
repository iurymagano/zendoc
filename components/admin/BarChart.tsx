'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { DailyPoint } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { formatDayShort, formatInt } from './format';

/**
 * Gráfico de barras de uma série diária (uma cor, uma série, sem legenda: o título nomeia).
 * Passar o mouse ou tocar numa barra mostra o dia e o valor na linha de leitura; sem
 * interação a linha mostra o último dia. Uma tabela oculta (`sr-only`) leva os mesmos dados
 * a quem usa leitor de tela. O gráfico em si é `aria-hidden`.
 */
export function BarChart({
  title,
  data,
  summaryLabel,
  summaryValue,
  unit,
  emptyText,
}: {
  title: string;
  data: DailyPoint[];
  /** Rótulo do número grande (ex.: "Total em 30 dias"). */
  summaryLabel: string;
  summaryValue: string;
  /** [singular, plural] do que a barra conta. */
  unit: [string, string];
  emptyText: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 0);
  const empty = max === 0;
  const current = hover ?? data.length - 1;
  const point = data[current];
  const first = data[0];
  const last = data[data.length - 1];
  const mid = data[Math.floor(data.length / 2)];

  return (
    <Card className="gap-4 rounded-[var(--radius-card)] px-5 py-5 ring-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-[0.9375rem] leading-snug font-semibold text-foreground">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl leading-none font-bold tracking-[-0.04em] tabular-nums">
            {summaryValue}
          </span>
          <span className="text-sm text-muted-foreground">{summaryLabel}</span>
        </div>
      </div>

      <div aria-hidden="true" className="flex h-5 items-center justify-between gap-3 text-sm text-foreground tabular-nums">
        <p>
          {point && !empty ? (
            <>
              <span className="font-mono text-[13px]">{formatDayShort(point.day)}</span>
              {': '}
              <span className="font-semibold">{formatInt(point.value)}</span>{' '}
              {point.value === 1 ? unit[0] : unit[1]}
            </>
          ) : null}
        </p>
        {!empty && <span className="text-xs text-muted-foreground">Máximo: {formatInt(max)}</span>}
      </div>

      <div aria-hidden="true" className="relative">
        <div
          className="flex h-28 items-end gap-[2px] border-b border-border"
          onPointerLeave={() => setHover(null)}
        >
          {data.map((d, i) => {
            const pct = max > 0 ? (d.value / max) * 100 : 0;
            return (
              <div
                key={d.day}
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
                className={cn(
                  'flex h-full min-w-0 flex-1 cursor-default items-end rounded-t-[3px] transition-colors duration-150',
                  hover === i && 'bg-muted',
                )}
              >
                <div
                  className={cn(
                    'w-full rounded-t-[3px] bg-[var(--ia-violet-action)] transition-opacity duration-150',
                    hover !== null && hover !== i && 'opacity-40',
                  )}
                  style={{ height: d.value > 0 ? `max(${pct}%, 3px)` : 0 }}
                />
              </div>
            );
          })}
        </div>
        {empty && (
          <p className="absolute inset-0 flex items-center justify-center px-4 pb-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
      </div>

      {first && mid && last && (
        <div
          aria-hidden="true"
          className="-mt-2 flex justify-between font-mono text-[11px] text-muted-foreground"
        >
          <span>{formatDayShort(first.day)}</span>
          <span>{formatDayShort(mid.day)}</span>
          <span>{formatDayShort(last.day)}</span>
        </div>
      )}

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>{unit[1]}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{formatDayShort(d.day)}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
