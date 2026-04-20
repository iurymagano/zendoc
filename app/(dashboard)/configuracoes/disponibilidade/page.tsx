'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  WeekdayRow,
  type DayState,
  type BlockState,
} from '@/components/availability/WeekdayRow';
import type { AvailabilityWeekly } from '@/types/database';

const EMPTY_BLOCK: BlockState = { enabled: false, start: '', end: '' };

function defaultDays(): DayState[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    active: weekday >= 1 && weekday <= 5,
    morning:
      weekday >= 1 && weekday <= 5
        ? { enabled: true, start: '08:00', end: '12:00' }
        : { ...EMPTY_BLOCK },
    lunch:
      weekday >= 1 && weekday <= 5
        ? { enabled: true, start: '12:00', end: '13:00' }
        : { ...EMPTY_BLOCK },
    afternoon:
      weekday >= 1 && weekday <= 5
        ? { enabled: true, start: '13:00', end: '18:00' }
        : { ...EMPTY_BLOCK },
  }));
}

function mergeFromApi(blocks: AvailabilityWeekly[]): DayState[] {
  const base = defaultDays().map((d) => ({
    ...d,
    active: false,
    morning: { ...EMPTY_BLOCK },
    lunch: { ...EMPTY_BLOCK },
    afternoon: { ...EMPTY_BLOCK },
  }));
  for (const b of blocks) {
    const day = base[b.weekday];
    day.active = day.active || b.is_active;
    const key = b.block_type as 'morning' | 'lunch' | 'afternoon';
    day[key] = {
      enabled: b.is_active,
      start: b.start_time.slice(0, 5),
      end: b.end_time.slice(0, 5),
    };
  }
  return base;
}

function daysToPayload(days: DayState[], slotDuration: number) {
  const blocks: {
    weekday: number;
    block_type: 'morning' | 'lunch' | 'afternoon';
    start_time: string;
    end_time: string;
    slot_duration: number;
    is_active: boolean;
  }[] = [];
  for (const day of days) {
    if (!day.active) continue;
    for (const key of ['morning', 'lunch', 'afternoon'] as const) {
      const b = day[key];
      if (!b.enabled || !b.start || !b.end) continue;
      blocks.push({
        weekday: day.weekday,
        block_type: key,
        start_time: b.start,
        end_time: b.end,
        slot_duration: slotDuration,
        is_active: true,
      });
    }
  }
  return blocks;
}

function AvailabilityForm() {
  const router = useRouter();
  const search = useSearchParams();
  const isOnboarding = search.get('onboarding') === '1';

  const [days, setDays] = useState<DayState[]>(defaultDays());
  const [slotDuration, setSlotDuration] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/availability/weekly');
      if (res.ok) {
        const body = await res.json();
        const blocks: AvailabilityWeekly[] = body.blocks ?? [];
        if (blocks.length > 0) {
          setDays(mergeFromApi(blocks));
          setSlotDuration(blocks[0].slot_duration);
        }
      }
      setLoaded(true);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    for (const day of days) {
      if (!day.active) continue;
      for (const key of ['morning', 'lunch', 'afternoon'] as const) {
        const b = day[key];
        if (b.enabled && b.start >= b.end) {
          setError(
            `No dia ${day.weekday}, o bloco "${key}" tem horário final menor ou igual ao inicial.`,
          );
          return;
        }
      }
    }

    setSaving(true);
    const res = await fetch('/api/availability/weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: daysToPayload(days, slotDuration) }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? 'Erro ao salvar disponibilidade.');
      return;
    }

    setSaved(true);
    if (isOnboarding) {
      router.push('/dashboard');
      router.refresh();
    }
  }

  if (!loaded) {
    return (
      <div className="text-sm text-muted-foreground">
        Carregando disponibilidade…
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Duração da consulta</CardTitle>
          <CardDescription>
            Tempo padrão de cada atendimento. A IA só oferece horários em
            múltiplos dessa duração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField label="Minutos por consulta" htmlFor="slot_duration">
            <Input
              id="slot_duration"
              type="number"
              min={15}
              max={240}
              step={5}
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="max-w-[120px]"
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {days.map((day, i) => (
          <WeekdayRow
            key={day.weekday}
            day={day}
            onChange={(next) =>
              setDays((prev) => {
                const copy = [...prev];
                copy[i] = next;
                return copy;
              })
            }
          />
        ))}
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {saved && !isOnboarding && (
        <div className="text-sm text-foreground">
          Disponibilidade salva com sucesso.
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {!isOnboarding && (
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Voltar
          </Link>
        )}
        <Button type="submit" size="lg" disabled={saving}>
          {saving
            ? 'Salvando…'
            : isOnboarding
              ? 'Finalizar e ir para o dashboard'
              : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

export default function AvailabilityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Configurações"
        title="Disponibilidade semanal"
        description="Defina os horários em que você atende em cada dia. A IA só oferece esses horários aos seus pacientes."
      />
      <Suspense fallback={<div className="h-32" />}>
        <AvailabilityForm />
      </Suspense>
    </div>
  );
}
