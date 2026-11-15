'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { presetTargets, WEEKDAY_NAMES } from '@/lib/availability/replicate';

const PRESETS = [
  { key: 'weekdays', label: 'Dias úteis' },
  { key: 'weekend', label: 'Fim de semana' },
  { key: 'all', label: 'Todos' },
] as const;

interface Props {
  /** Dia de origem (0 = domingo). Não aparece na lista de destinos. */
  sourceWeekday: number;
  /** Chamado com os dias marcados quando o usuário clica em "Aplicar". */
  onApply: (targets: number[]) => void;
}

/**
 * Botão "Replicar" de um dia: abre um popover com os outros dias em
 * checkboxes (+ atalhos) e um "Aplicar". Só escolhe os destinos; a cópia em si
 * é `replicateDay` (lib/availability/replicate.ts), feita pela tela.
 */
export function ReplicateDayButton({ sourceWeekday, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const others = WEEKDAY_NAMES.map((name, weekday) => ({ name, weekday })).filter(
    (d) => d.weekday !== sourceWeekday,
  );

  function toggle(weekday: number, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, weekday] : prev.filter((w) => w !== weekday),
    );
  }

  function apply() {
    if (selected.length === 0) return;
    onApply(selected);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSelected([]); // sempre abre sem nada marcado
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Replicar ${WEEKDAY_NAMES[sourceWeekday]} para outros dias`}
          />
        }
      >
        <Copy aria-hidden />
        Replicar
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(18rem,calc(100vw-2rem))]">
        <PopoverHeader>
          <PopoverTitle>Copiar {WEEKDAY_NAMES[sourceWeekday]} para</PopoverTitle>
          <PopoverDescription>
            Manhã, almoço e tarde: horários e o que está ligado.
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setSelected(presetTargets(p.key, sourceWeekday))}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {others.map(({ name, weekday }) => (
            <Label
              key={weekday}
              className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-normal"
            >
              <Checkbox
                checked={selected.includes(weekday)}
                onCheckedChange={(v: boolean) => toggle(weekday, v)}
              />
              {name}
            </Label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={selected.length === 0} onClick={apply}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
