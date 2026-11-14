// Slots têm que sair em America/Sao_Paulo (-03:00) em QUALQUER fuso do servidor
// (a Vercel roda em UTC). Cada teste roda a mesma conta com TZ=UTC e outros
// fusos e exige resultado idêntico.
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { toSaoPauloIso } from '../assistant/datetime';
import {
  computeSlots,
  type ComputeSlotsInput,
  type ExceptionInput,
  type WeeklyBlockInput,
} from './compute';

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

const SERVER_ZONES = ['UTC', 'America/Sao_Paulo', 'Asia/Tokyo', 'America/Los_Angeles'];

/** Roda `fn` em cada fuso de servidor e garante que o resultado é o mesmo. */
function inEveryZone<T>(fn: () => T): T {
  const results = SERVER_ZONES.map((tz) => {
    process.env.TZ = tz;
    // Sanidade: o fuso do processo mudou de fato.
    const probe = new Date('2026-01-15T12:00:00Z');
    assert.equal(
      -probe.getTimezoneOffset() || 0,
      { UTC: 0, 'America/Sao_Paulo': -180, 'Asia/Tokyo': 540, 'America/Los_Angeles': -480 }[tz],
      `TZ=${tz} não foi aplicado`,
    );
    return fn();
  });
  for (const r of results) assert.deepEqual(r, results[0]);
  return results[0];
}

// Sábado 14/11/2026 16:57 em São Paulo = 19:57 UTC.
const NOW = new Date('2026-11-14T19:57:00Z');

const monday: WeeklyBlockInput = {
  weekday: 1,
  start_time: '08:00:00', // formato do Postgres `time`
  end_time: '12:00:00',
  slot_duration: 60,
};

function slotsIso(over: Partial<ComputeSlotsInput> = {}): string[] {
  return computeSlots({
    now: NOW,
    days: 14,
    weekly: [monday],
    exceptions: [],
    busy: [],
    ...over,
  }).map((s) => `${toSaoPauloIso(s.start)}→${toSaoPauloIso(s.end)}`);
}

describe('computeSlots em fusos de servidor diferentes', () => {
  it('bloco 08:00–12:00 gera o primeiro slot às 08:00-03:00 (= 11:00Z)', () => {
    const slots = inEveryZone(() =>
      computeSlots({ now: NOW, days: 14, weekly: [monday], exceptions: [], busy: [] }),
    );
    // Segunda 16/11 é o primeiro dia com bloco; 4 slots de 60 min.
    assert.equal(slots[0].start.toISOString(), '2026-11-16T11:00:00.000Z');
    assert.equal(toSaoPauloIso(slots[0].start), '2026-11-16T08:00:00-03:00');
    assert.deepEqual(slotsIso().slice(0, 4), [
      '2026-11-16T08:00:00-03:00→2026-11-16T09:00:00-03:00',
      '2026-11-16T09:00:00-03:00→2026-11-16T10:00:00-03:00',
      '2026-11-16T10:00:00-03:00→2026-11-16T11:00:00-03:00',
      '2026-11-16T11:00:00-03:00→2026-11-16T12:00:00-03:00',
    ]);
    // 14 dias a partir de amanhã (15/11..28/11) → segundas 16/11 e 23/11.
    assert.equal(slots.length, 8);
  });

  it('descarta o slot que conflita com atendimento existente', () => {
    const iso = inEveryZone(() =>
      slotsIso({
        busy: [
          {
            starts_at: '2026-11-16T09:00:00-03:00',
            ends_at: '2026-11-16T10:00:00-03:00',
          },
        ],
      }),
    );
    const day16 = iso.filter((s) => s.startsWith('2026-11-16'));
    assert.deepEqual(
      day16.map((s) => s.slice(11, 16)),
      ['08:00', '10:00', '11:00'],
    );
  });

  it('conflito dado em UTC (11:00Z) bloqueia o slot das 08:00 de São Paulo', () => {
    const iso = inEveryZone(() =>
      slotsIso({
        busy: [{ starts_at: '2026-11-16T11:00:00Z', ends_at: '2026-11-16T12:00:00Z' }],
      }),
    );
    assert.ok(!iso.some((s) => s.startsWith('2026-11-16T08:00')));
    assert.ok(iso.some((s) => s.startsWith('2026-11-16T09:00')));
  });

  it('buffer de 15 min bloqueia os vizinhos do compromisso', () => {
    const iso = inEveryZone(() =>
      slotsIso({
        bufferMin: 15,
        busy: [
          {
            starts_at: '2026-11-16T09:00:00-03:00',
            ends_at: '2026-11-16T10:00:00-03:00',
          },
        ],
      }),
    );
    const day16 = iso.filter((s) => s.startsWith('2026-11-16'));
    assert.deepEqual(
      day16.map((s) => s.slice(11, 16)),
      ['11:00'],
    );
  });

  it('o "dia de hoje" é o de São Paulo, mesmo quando em UTC já virou o dia', () => {
    // 01:30Z de domingo 15/11 = 22:30 de SÁBADO 14/11 em São Paulo.
    const lateNow = new Date('2026-11-15T01:30:00Z');
    const sunday: WeeklyBlockInput = {
      weekday: 0,
      start_time: '10:00',
      end_time: '11:00',
      slot_duration: 50,
    };
    const iso = inEveryZone(() =>
      slotsIso({ now: lateNow, days: 1, weekly: [sunday] }),
    );
    // Amanhã (em São Paulo) é domingo 15/11: o slot existe. Em UTC "ingênuo"
    // o servidor acharia que hoje já é dia 15 e pularia para a segunda.
    assert.deepEqual(iso, ['2026-11-15T10:00:00-03:00→2026-11-15T10:50:00-03:00']);
  });

  it('dia da semana é o do calendário de São Paulo (bloco de domingo)', () => {
    const sunday: WeeklyBlockInput = {
      weekday: 0,
      start_time: '23:00',
      end_time: '23:50',
      slot_duration: 50,
    };
    // 23:00-03:00 de domingo já é segunda 02:00Z — não pode virar bloco de segunda.
    const iso = inEveryZone(() => slotsIso({ weekly: [sunday] }));
    assert.equal(iso[0], '2026-11-15T23:00:00-03:00→2026-11-15T23:50:00-03:00');
    assert.ok(iso.every((s) => s.slice(0, 10) === '2026-11-15' || s.slice(0, 10) === '2026-11-22'));
  });

  it('day_off remove o dia; custom_hours substitui a rotina', () => {
    const dayOff: ExceptionInput = {
      date: '2026-11-16',
      type: 'day_off',
      start_time: null,
      end_time: null,
      slot_duration: null,
    };
    const custom: ExceptionInput = {
      date: '2026-11-23',
      type: 'custom_hours',
      start_time: '14:00:00',
      end_time: '16:00:00',
      slot_duration: 30,
    };
    const iso = inEveryZone(() => slotsIso({ exceptions: [dayOff, custom] }));
    assert.ok(!iso.some((s) => s.startsWith('2026-11-16')));
    assert.deepEqual(
      iso.filter((s) => s.startsWith('2026-11-23')).map((s) => s.slice(11, 16)),
      ['14:00', '14:30', '15:00', '15:30'],
    );
  });

  it('só oferece slots no futuro', () => {
    // "Agora" = segunda 16/11 09:30 SP; janela começa amanhã, então nenhum slot de hoje.
    const monday0930 = new Date('2026-11-16T12:30:00Z');
    const iso = inEveryZone(() => slotsIso({ now: monday0930, days: 1 }));
    assert.deepEqual(iso, []);
  });
});
