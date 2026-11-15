import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDaysKey, occurrenceDates } from './dates';

// Caso real do bug (14/11/2026): série quinzenal criada no sábado começando na
// quinta 12/11, até 18/12. Sem a 1ª data, o atendimento escolhido sumia da semana.
const rule = { startDate: '2026-11-12', intervalWeeks: 2, until: '2026-12-18' };

test('na criação, inclui a 1ª data mesmo já passada', () => {
  assert.deepEqual(
    occurrenceDates(rule, { today: '2026-11-14', horizonWeeks: 8, includePastStart: true }),
    ['2026-11-12', '2026-11-26', '2026-12-10'],
  );
});

test('no cron (sem includePastStart), nunca gera data passada', () => {
  assert.deepEqual(occurrenceDates(rule, { today: '2026-11-14', horizonWeeks: 8 }), [
    '2026-11-26',
    '2026-12-10',
  ]);
});

test('só a 1ª data passada entra; as seguintes que já passaram não', () => {
  const weekly = { startDate: '2026-11-01', intervalWeeks: 1, until: null };
  assert.deepEqual(
    occurrenceDates(weekly, { today: '2026-11-14', horizonWeeks: 1, includePastStart: true }),
    ['2026-11-01', '2026-11-15'], // horizonte de 1 semana termina em 21/11
  );
});

test('respeita o horizonte e o until', () => {
  const weekly = { startDate: '2026-11-16', intervalWeeks: 1, until: null };
  assert.deepEqual(occurrenceDates(weekly, { today: '2026-11-14', horizonWeeks: 2 }), [
    '2026-11-16',
    '2026-11-23',
  ]);
  assert.deepEqual(
    occurrenceDates({ ...weekly, until: '2026-11-16' }, { today: '2026-11-14', horizonWeeks: 8 }),
    ['2026-11-16'],
  );
});

test('a 1ª data hoje entra sempre', () => {
  const r = { startDate: '2026-11-14', intervalWeeks: 1, until: '2026-11-14' };
  assert.deepEqual(occurrenceDates(r, { today: '2026-11-14', horizonWeeks: 8 }), ['2026-11-14']);
});

test('addDaysKey atravessa mês e ano', () => {
  assert.equal(addDaysKey('2026-12-28', 7), '2027-01-04');
  assert.equal(addDaysKey('2026-02-27', 2), '2026-03-01');
});
