// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addDaysToDate,
  addMinutesToIso,
  buildCalendarHint,
  buildIso,
  calendarValueToIso,
  dayRangeIso,
  describeNow,
  diffDays,
  formatBrDate,
  formatBrDateTime,
  formatLongBrDate,
  formatLongBrDateTime,
  formatTime,
  isValidDate,
  isValidTime,
  saoPauloInstantMs,
  saoPauloParts,
  toSaoPauloIso,
  weekdayOfDate,
  weekdayShortOf,
} from './datetime';

// 2026-11-14 (sábado) 16:57 em São Paulo = 19:57 UTC.
const NOW = new Date('2026-11-14T19:57:00Z');

test('saoPauloParts converte UTC para o relógio de São Paulo', () => {
  const p = saoPauloParts(NOW);
  assert.equal(p.date, '2026-11-14');
  assert.equal(p.time, '16:57');
  assert.equal(p.weekday, 6);
});

test('saoPauloParts vira o dia/ano corretamente (UTC já no dia seguinte)', () => {
  // 01:30 UTC de 01/01/2027 ainda é 22:30 de 31/12/2026 em São Paulo.
  const p = saoPauloParts(new Date('2027-01-01T01:30:00Z'));
  assert.equal(p.date, '2026-12-31');
  assert.equal(p.time, '22:30');
  assert.equal(p.year, 2026);
});

test('toSaoPauloIso devolve ISO com offset -03:00', () => {
  assert.equal(toSaoPauloIso(NOW), '2026-11-14T16:57:00-03:00');
});

test('isValidDate rejeita datas que não existem', () => {
  assert.equal(isValidDate('2026-11-18'), true);
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-13-01'), false);
  assert.equal(isValidDate('18/11/2026'), false);
  assert.equal(isValidDate(''), false);
});

test('isValidTime aceita só HH:mm de 24h', () => {
  assert.equal(isValidTime('00:00'), true);
  assert.equal(isValidTime('23:59'), true);
  assert.equal(isValidTime('24:00'), false);
  assert.equal(isValidTime('9:00'), false);
  assert.equal(isValidTime('10:60'), false);
  assert.equal(isValidTime('10h'), false);
});

test('buildIso monta o ISO -03:00 e devolve null para entrada inválida', () => {
  assert.equal(buildIso('2026-11-18', '14:00'), '2026-11-18T14:00:00-03:00');
  assert.equal(buildIso('2026-02-30', '14:00'), null);
  assert.equal(buildIso('2026-11-18', '25:00'), null);
});

test('addMinutesToIso atravessa a meia-noite', () => {
  assert.equal(
    addMinutesToIso('2026-11-18T23:30:00-03:00', 60),
    '2026-11-19T00:30:00-03:00',
  );
  assert.equal(
    addMinutesToIso('2026-11-18T14:00:00-03:00', 50),
    '2026-11-18T14:50:00-03:00',
  );
});

test('addDaysToDate e diffDays', () => {
  assert.equal(addDaysToDate('2026-12-30', 3), '2027-01-02');
  assert.equal(addDaysToDate('2026-03-01', -1), '2026-02-28');
  assert.equal(diffDays('2026-11-14', '2026-11-18'), 4);
  assert.equal(diffDays('2026-11-18', '2026-11-14'), -4);
  assert.ok(Number.isNaN(diffDays('x', '2026-11-14')));
});

test('dayRangeIso cobre [início do primeiro dia, início do dia seguinte ao último)', () => {
  assert.deepEqual(dayRangeIso('2026-11-18', '2026-11-18'), {
    start: '2026-11-18T00:00:00-03:00',
    endExclusive: '2026-11-19T00:00:00-03:00',
  });
  assert.deepEqual(dayRangeIso('2026-12-30', '2026-12-31'), {
    start: '2026-12-30T00:00:00-03:00',
    endExclusive: '2027-01-01T00:00:00-03:00',
  });
});

test('weekdayShortOf e formatBrDate', () => {
  assert.equal(weekdayShortOf('2026-11-18'), 'qua');
  assert.equal(formatBrDate('2026-11-18', NOW), 'qua, 18/11');
  // Outro ano ganha o ano para não confundir.
  assert.equal(formatBrDate('2027-01-05', NOW), 'ter, 05/01/2027');
});

test('formatBrDateTime e formatTime usam o relógio de São Paulo', () => {
  assert.equal(
    formatBrDateTime('2026-11-18T14:00:00-03:00', NOW),
    'qua, 18/11 às 14:00',
  );
  // Mesmo instante escrito em UTC.
  assert.equal(
    formatBrDateTime('2026-11-18T17:00:00Z', NOW),
    'qua, 18/11 às 14:00',
  );
  assert.equal(formatTime('2026-11-18T17:05:00Z'), '14:05');
});

test('describeNow ancora o "agora" por extenso', () => {
  assert.equal(describeNow(NOW), 'sábado, 14/11/2026, 16:57');
});

test('buildCalendarHint lista hoje/amanhã e os dias seguintes com a data certa', () => {
  const hint = buildCalendarHint(NOW, 3);
  const lines = hint.split('\n');
  assert.equal(lines.length, 4);
  assert.equal(lines[0], '- sábado (hoje): 2026-11-14');
  assert.equal(lines[1], '- domingo (amanhã): 2026-11-15');
  assert.equal(lines[2], '- segunda-feira: 2026-11-16');
  assert.equal(lines[3], '- terça-feira: 2026-11-17');
});

test('buildCalendarHint usa a data de São Paulo, não a UTC', () => {
  // 02:00 UTC de 15/11 ainda é 23:00 de 14/11 em São Paulo.
  const hint = buildCalendarHint(new Date('2026-11-15T02:00:00Z'), 1);
  assert.match(hint, /^- sábado \(hoje\): 2026-11-14/);
});

test('formatos longos usam o relógio de São Paulo mesmo com o servidor em UTC', () => {
  const original = process.env.TZ;
  try {
    for (const tz of ['UTC', 'Asia/Tokyo', 'America/Los_Angeles']) {
      process.env.TZ = tz;
      // 01:30Z de domingo 15/11 = 22:30 de sábado 14/11 em São Paulo.
      const late = new Date('2026-11-15T01:30:00Z');
      assert.equal(formatLongBrDate(late), 'sábado, 14 de novembro de 2026');
      assert.equal(formatLongBrDateTime(late), 'sábado, 14 de novembro de 2026 às 22:30');
      assert.equal(toSaoPauloIso(late), '2026-11-14T22:30:00-03:00');
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('weekdayOfDate e saoPauloInstantMs', () => {
  assert.equal(weekdayOfDate('2026-11-16'), 1);
  assert.ok(Number.isNaN(weekdayOfDate('2026-02-30x')));
  assert.equal(
    new Date(saoPauloInstantMs('2026-11-16', '08:00:00')).toISOString(),
    '2026-11-16T11:00:00.000Z',
  );
  assert.equal(
    new Date(saoPauloInstantMs('2026-11-16', '08:00')).toISOString(),
    '2026-11-16T11:00:00.000Z',
  );
  assert.ok(Number.isNaN(saoPauloInstantMs('2026-11-16', '8h')));
});

test('calendarValueToIso ancora data de dia inteiro à meia-noite de São Paulo', () => {
  // "2026-11-18" sem hora: meia-noite de SP = 03:00Z (não 00:00Z).
  assert.equal(calendarValueToIso('2026-11-18'), '2026-11-18T03:00:00.000Z');
  // Com hora e offset, só normaliza para UTC.
  assert.equal(calendarValueToIso('2026-11-18T10:00:00-03:00'), '2026-11-18T13:00:00.000Z');
});
