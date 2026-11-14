'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bubble } from './Bubble';

const TONES = {
  amigavel: {
    label: 'Amigável',
    reply: 'Claro, Camila! Na sexta tenho 9h ou 16h. Qual fica melhor para você?',
    confirm: 'Fechado! Sexta, 20/11, às 9h. Até lá!',
  },
  formal: {
    label: 'Formal',
    reply: 'Pois não, Camila. Na sexta-feira há horários às 9h e às 16h. Qual prefere?',
    confirm: 'Confirmado: sexta-feira, 20/11, às 9h. Até breve.',
  },
} as const;

type Tone = keyof typeof TONES;

/** Mesma pergunta, dois tons: mostra o ajuste de personalidade da secretária. */
export function ToneDemo() {
  const [tone, setTone] = useState<Tone>('amigavel');

  return (
    <div>
      <div role="group" aria-label="Tom da secretária" className="mb-4 flex gap-2">
        {(Object.keys(TONES) as Tone[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tone === t ? 'default' : 'outline'}
            aria-pressed={tone === t}
            onClick={() => setTone(t)}
          >
            {TONES[t].label}
          </Button>
        ))}
      </div>
      <div
        className="dark flex min-h-[300px] flex-col gap-3 rounded-[28px] bg-card p-4 sm:p-6"
        aria-live="polite"
      >
        <Bubble side="in" time="18:12">
          Dá para remarcar o treino para sexta?
        </Bubble>
        <Bubble key={`r-${tone}`} side="out" time="18:12" className="ia-rise">
          {TONES[tone].reply}
        </Bubble>
        <Bubble side="in" time="18:13">
          Às 9h, por favor.
        </Bubble>
        <Bubble key={`c-${tone}`} side="out" time="18:13" className="ia-rise" style={{ '--d': '120ms' } as React.CSSProperties}>
          {TONES[tone].confirm}
        </Bubble>
      </div>
    </div>
  );
}
