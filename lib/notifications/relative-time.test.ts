import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeTime } from './relative-time';

const NOW = new Date('2026-11-14T15:00:00Z'); // 12:00 em SP
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

test('menos de um minuto: agora', () => {
  assert.equal(formatRelativeTime(ago(10_000), NOW), 'agora');
});

test('minutos e horas no mesmo dia', () => {
  assert.equal(formatRelativeTime(ago(5 * MIN), NOW), 'há 5 min');
  assert.equal(formatRelativeTime(ago(59.6 * MIN), NOW), 'há 59 min');
  assert.equal(formatRelativeTime(ago(3 * HOUR), NOW), 'há 3 h');
});

test('depois da meia-noite de SP vira "ontem"', () => {
  // 20h atrás = 16:00 de ontem em SP
  assert.equal(formatRelativeTime(ago(20 * HOUR), NOW), 'ontem');
  assert.equal(formatRelativeTime(ago(30 * HOUR), NOW), 'ontem');
});

test('dias e data', () => {
  assert.equal(formatRelativeTime(ago(3 * 24 * HOUR), NOW), 'há 3 dias');
  assert.equal(formatRelativeTime(ago(10 * 24 * HOUR), NOW), '04/11');
  assert.equal(formatRelativeTime(ago(400 * 24 * HOUR), NOW), '10/10/2025');
});

test('data inválida devolve vazio', () => {
  assert.equal(formatRelativeTime('xx', NOW), '');
});
