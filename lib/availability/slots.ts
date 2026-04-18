import {
  addDays,
  addMinutes,
  format,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns';
import { createServerClient } from '@/lib/supabase';
import type {
  AvailabilityException,
  AvailabilityWeekly,
} from '@/types/database';

type BlockSource = { start: string; end: string; duration: number };

function buildBlocks(
  date: Date,
  weekly: AvailabilityWeekly[] | null,
  exception: AvailabilityException | undefined,
): BlockSource[] {
  if (exception?.type === 'custom_hours' || exception?.type === 'extra_day') {
    if (!exception.start_time || !exception.end_time) return [];
    return [
      {
        start: exception.start_time,
        end: exception.end_time,
        duration: exception.slot_duration ?? 50,
      },
    ];
  }

  const weekday = date.getDay();
  return (weekly ?? [])
    .filter((w) => w.weekday === weekday)
    .map((w) => ({
      start: w.start_time,
      end: w.end_time,
      duration: w.slot_duration,
    }));
}

export async function getAvailableSlots(
  professionalId: string,
  days = 14,
): Promise<Date[]> {
  const supabase = createServerClient();
  const now = new Date();
  const slots: Date[] = [];

  const { data: weekly } = await supabase
    .from('availability_weekly')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .neq('block_type', 'lunch');

  const from = format(now, 'yyyy-MM-dd');
  const to = format(addDays(now, days), 'yyyy-MM-dd');

  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('date', from)
    .lte('date', to);

  const { data: existing } = await supabase
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('professional_id', professionalId)
    .gte('starts_at', now.toISOString())
    .in('status', ['scheduled', 'confirmed', 'pending_approval']);

  for (let i = 1; i <= days; i++) {
    const date = addDays(now, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const exception = exceptions?.find((e) => e.date === dateStr);

    if (exception?.type === 'day_off') continue;

    for (const block of buildBlocks(date, weekly, exception)) {
      const [sh, sm] = block.start.split(':').map(Number);
      const [eh, em] = block.end.split(':').map(Number);
      const base = startOfDay(date);
      let slot = setMinutes(setHours(base, sh), sm);
      const blockEnd = setMinutes(setHours(base, eh), em);

      while (true) {
        const slotEnd = addMinutes(slot, block.duration);
        const fitsInBlock =
          isBefore(slotEnd, blockEnd) || slotEnd.getTime() === blockEnd.getTime();
        if (!fitsInBlock) break;

        const hasConflict = (existing ?? []).some((a) => {
          const s = new Date(a.starts_at);
          const e = new Date(a.ends_at);
          return slot < e && slotEnd > s;
        });

        if (!hasConflict && slot > now) slots.push(new Date(slot));
        slot = addMinutes(slot, block.duration);
      }
    }
  }

  return slots;
}
