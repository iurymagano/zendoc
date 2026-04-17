'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export type BlockState = {
  enabled: boolean;
  start: string;
  end: string;
};

export type DayState = {
  weekday: number;
  active: boolean;
  morning: BlockState;
  lunch: BlockState;
  afternoon: BlockState;
};

const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

interface BlockEditorProps {
  label: string;
  state: BlockState;
  onChange: (next: BlockState) => void;
  disabled?: boolean;
}

function BlockEditor({ label, state, onChange, disabled }: BlockEditorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-40">
        <Switch
          checked={state.enabled}
          onCheckedChange={(v: boolean) => onChange({ ...state, enabled: v })}
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <Input
        type="time"
        value={state.start}
        disabled={disabled || !state.enabled}
        onChange={(e) => onChange({ ...state, start: e.target.value })}
        className="w-32"
      />
      <span className="text-sm text-muted-foreground">até</span>
      <Input
        type="time"
        value={state.end}
        disabled={disabled || !state.enabled}
        onChange={(e) => onChange({ ...state, end: e.target.value })}
        className="w-32"
      />
    </div>
  );
}

interface Props {
  day: DayState;
  onChange: (next: DayState) => void;
}

export function WeekdayRow({ day, onChange }: Props) {
  const label = WEEKDAY_LABELS[day.weekday];
  const update = (patch: Partial<DayState>) => onChange({ ...day, ...patch });

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {day.active ? 'Atendo' : 'Não atendo'}
          </span>
          <Switch
            checked={day.active}
            onCheckedChange={(v: boolean) => update({ active: v })}
          />
        </div>
      </div>

      {day.active && (
        <div className="flex flex-col gap-2 pl-1">
          <BlockEditor
            label="Manhã"
            state={day.morning}
            onChange={(s) => update({ morning: s })}
          />
          <BlockEditor
            label="Almoço (pausa)"
            state={day.lunch}
            onChange={(s) => update({ lunch: s })}
          />
          <BlockEditor
            label="Tarde"
            state={day.afternoon}
            onChange={(s) => update({ afternoon: s })}
          />
        </div>
      )}
    </div>
  );
}
