// Rodar: npm test  (node:test via tsx). Também passa com TZ=America/Sao_Paulo e TZ=Asia/Tokyo.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayRuler, dayWindows, weekOccupancy, weekOf } from './schedule';

// sábado, 14/11/2026, 16:57 em São Paulo (19:57 UTC)
const NOW = new Date('2026-11-14T16:57:00-03:00');

const weekly = [
  // segunda (1) a sexta (5): 08:00–12:00 e 14:00–18:00
  ...[1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, start_time: '08:00:00', end_time: '12:00:00', slot_duration: 50 },
    { weekday, start_time: '14:00:00', end_time: '18:00:00', slot_duration: 50 },
  ]),
];

test('weekOf: segunda a domingo da semana de São Paulo', () => {
  const w = weekOf(NOW);
  assert.equal(w.start, '2026-11-09');
  assert.equal(w.end, '2026-11-15');
  assert.equal(w.today, '2026-11-14');
  assert.equal(w.days.length, 7);
  // domingo ainda é a semana que termina nele
  assert.equal(weekOf(new Date('2026-11-15T10:00:00-03:00')).start, '2026-11-09');
  // 23:30 de sábado em SP já é domingo em UTC; segue sendo sábado em SP
  assert.equal(weekOf(new Date('2026-11-14T23:30:00-03:00')).today, '2026-11-14');
});

test('dayWindows: rotina semanal, folga e exceção com horário próprio', () => {
  assert.equal(dayWindows('2026-11-09', weekly, []).length, 2);
  assert.equal(dayWindows('2026-11-14', weekly, []).length, 0);
  const off = [{ date: '2026-11-09', type: 'day_off' as const, start_time: null, end_time: null, slot_duration: null }];
  assert.equal(dayWindows('2026-11-09', weekly, off).length, 0);
  const extra = [{ date: '2026-11-14', type: 'extra_day' as const, start_time: '09:00:00', end_time: '13:00:00', slot_duration: 60 }];
  const w = dayWindows('2026-11-14', weekly, extra);
  assert.equal(w.length, 1);
  assert.equal((w[0][1] - w[0][0]) / 60_000, 240);
});

test('weekOccupancy: capacidade, ocupado, bloqueado pelo Google e livre', () => {
  const occ = weekOccupancy({
    now: NOW,
    weekly,
    exceptions: [{ date: '2026-11-13', type: 'day_off', start_time: null, end_time: null, slot_duration: null }],
    appointments: [
      // segunda 09:00–10:00 (60 min) e 11:30–12:30 (só 30 min dentro do horário)
      { starts_at: '2026-11-09T09:00:00-03:00', ends_at: '2026-11-09T10:00:00-03:00' },
      { starts_at: '2026-11-09T11:30:00-03:00', ends_at: '2026-11-09T12:30:00-03:00' },
    ],
    busy: [
      // Google: 09:30–10:30 (30 min novos, 30 já ocupados)
      { starts_at: '2026-11-09T09:30:00-03:00', ends_at: '2026-11-09T10:30:00-03:00' },
    ],
  });
  const mon = occ.days[0];
  assert.equal(mon.capacityMin, 480);
  assert.equal(mon.bookedMin, 90);
  assert.equal(mon.blockedMin, 30);
  assert.equal(mon.freeMin, 480 - 120);
  assert.equal(mon.count, 2);
  assert.equal(mon.isPast, true);
  assert.equal(occ.days[4].capacityMin, 0); // sexta com folga
  assert.equal(occ.days[5].isToday, true);
  assert.equal(occ.capacityMin, 480 * 4);
  assert.equal(occ.occupancyPct, Math.round((90 / (480 * 4)) * 100));
});

test('weekOccupancy: sem horário cadastrado não inventa percentual', () => {
  const occ = weekOccupancy({ now: NOW, weekly: [], exceptions: [], appointments: [], busy: [] });
  assert.equal(occ.capacityMin, 0);
  assert.equal(occ.occupancyPct, null);
});

test('dayRuler: régua em horas cheias, atendimentos e marca de agora', () => {
  const ruler = dayRuler({
    now: new Date('2026-11-09T10:30:00-03:00'),
    date: '2026-11-09',
    weekly,
    exceptions: [],
    appointments: [{ id: 'a', starts_at: '2026-11-09T09:00:00-03:00', ends_at: '2026-11-09T10:00:00-03:00' }],
  });
  assert.ok(ruler);
  // 08:00 a 18:00 = 10 h
  assert.equal(ruler.ticks.length, 11);
  assert.equal(ruler.ticks[0].hour, 8);
  assert.equal(ruler.segments[0].left, 10);
  assert.equal(ruler.segments[0].width, 10);
  assert.equal(ruler.nowPct, 25);
  assert.equal(ruler.windows.length, 2);
});

test('dayRuler: atendimento fora do horário estica a régua; dia vazio é null', () => {
  const ruler = dayRuler({
    now: NOW,
    date: '2026-11-14',
    weekly,
    exceptions: [],
    appointments: [{ id: 'x', starts_at: '2026-11-14T19:00:00-03:00', ends_at: '2026-11-14T20:00:00-03:00' }],
  });
  assert.ok(ruler);
  assert.equal(ruler.ticks[0].hour, 19);
  assert.equal(ruler.nowPct, null);
  assert.equal(dayRuler({ now: NOW, date: '2026-11-14', weekly, exceptions: [], appointments: [] }), null);
});
