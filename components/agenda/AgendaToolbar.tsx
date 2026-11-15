'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { View } from '@/components/agenda/agenda-utils';

const VIEW_NAME: Record<View, string> = {
  day: 'dia',
  week: 'semana',
  month: 'mês',
};

type Props = {
  view: View;
  onViewChange: (view: View) => void;
  /** Texto do período atual (ex.: "09 – 15 de novembro de 2026"). */
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

/**
 * Barra da agenda: período atual, anterior/próximo, Hoje e a troca de visão
 * Dia/Semana/Mês. O botão "Novo agendamento" fica no cabeçalho da página.
 */
export function AgendaToolbar({
  view,
  onViewChange,
  label,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const name = VIEW_NAME[view];
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onPrev}
            aria-label={`Anterior: ${name}`}
          >
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday}>
            Hoje
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onNext}
            aria-label={`Próximo: ${name}`}
          >
            <ChevronRight />
          </Button>
        </div>
        <h2
          className="min-w-0 text-base font-semibold leading-snug text-foreground sm:text-lg"
          aria-live="polite"
        >
          {label}
        </h2>
      </div>
      <Tabs value={view} onValueChange={(v) => onViewChange(v as View)}>
        <TabsList aria-label="Visão da agenda">
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
