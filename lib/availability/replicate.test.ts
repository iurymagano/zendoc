// Rodar: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  describeWeekdays,
  presetTargets,
  replicateDay,
  type DayState,
} from './replicate';

const off = { enabled: false, start: '', end: '' };

function week(): DayState[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    active: weekday === 1,
    morning:
      weekday === 1 ? { enabled: true, start: '09:00', end: '12:30' } : { ...off },
    lunch: weekday === 1 ? { enabled: false, start: '12:30', end: '14:00' } : { ...off },
    afternoon:
      weekday === 1 ? { enabled: true, start: '14:00', end: '19:00' } : { ...off },
  }));
}

test('replicateDay copia ligado/desligado e os três blocos para os alvos', () => {
  const days = week();
  const out = replicateDay(days, 1, [2, 3]);
  for (const w of [2, 3]) {
    assert.equal(out[w].weekday, w);
    assert.equal(out[w].active, true);
    assert.deepEqual(out[w].morning, { enabled: true, start: '09:00', end: '12:30' });
    assert.deepEqual(out[w].lunch, { enabled: false, start: '12:30', end: '14:00' });
    assert.deepEqual(out[w].afternoon, { enabled: true, start: '14:00', end: '19:00' });
  }
});

test('replicateDay não mexe nos outros dias nem na origem, e não altera a entrada', () => {
  const days = week();
  const snapshot = JSON.stringify(days);
  const out = replicateDay(days, 1, [2]);
  assert.equal(JSON.stringify(days), snapshot);
  assert.deepEqual(out[0], days[0]);
  assert.deepEqual(out[1], days[1]);
  assert.deepEqual(out[4], days[4]);
  assert.equal(out[2].active, true);
});

test('replicateDay devolve cópias independentes dos blocos', () => {
  const out = replicateDay(week(), 1, [2, 3]);
  out[2].morning.start = '07:00';
  assert.equal(out[3].morning.start, '09:00');
  assert.equal(out[1].morning.start, '09:00');
});

test('replicateDay copia também um dia desligado ("Não atendo")', () => {
  const days = week();
  days[2] = { ...days[1], weekday: 2 };
  const out = replicateDay(days, 0, [1, 2]);
  assert.equal(out[1].active, false);
  assert.equal(out[2].active, false);
  assert.deepEqual(out[1].morning, off);
});

test('replicateDay ignora origem como alvo, repetidos, dias inválidos e origem inexistente', () => {
  const days = week();
  const out = replicateDay(days, 1, [1, 2, 2, 9, -1]);
  assert.equal(out[2].active, true);
  assert.equal(out[1], days[1]);
  assert.equal(replicateDay(days, 9, [2]), days);
  assert.deepEqual(replicateDay(days, 1, []), days);
});

test('presetTargets exclui o dia de origem', () => {
  assert.deepEqual(presetTargets('weekdays', 1), [2, 3, 4, 5]);
  assert.deepEqual(presetTargets('weekdays', 0), [1, 2, 3, 4, 5]);
  assert.deepEqual(presetTargets('weekend', 6), [0]);
  assert.deepEqual(presetTargets('all', 3), [0, 1, 2, 4, 5, 6]);
});

test('describeWeekdays ordena e abrevia', () => {
  assert.equal(describeWeekdays([3, 1, 2]), 'seg, ter, qua');
  assert.equal(describeWeekdays([0, 6]), 'sáb, dom');
  assert.equal(describeWeekdays([2, 2]), 'ter');
  assert.equal(describeWeekdays([]), '');
});
