// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RATE_LIMITS, evaluateRateLimit } from './rate-limit';

const NOW = new Date('2026-11-18T15:00:00-03:00');
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;

// n mensagens espaçadas de 1s, começando `startMs` atrás.
const burstOf = (n: number, startMs: number) =>
  Array.from({ length: n }, (_, i) => ago(startMs - i * 1000));

test('sem mensagens ou abaixo do limite: libera', () => {
  assert.deepEqual(evaluateRateLimit([], NOW), { ok: true });
  assert.deepEqual(evaluateRateLimit(burstOf(29, 5 * MIN), NOW), { ok: true });
});

test('30 mensagens em 10 min: bloqueia a rajada com espera até a mais antiga sair', () => {
  // 30 msgs: a mais antiga (a 9 min) sai da janela de 10 min em ~60s.
  const r = evaluateRateLimit(burstOf(30, 9 * MIN), NOW);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.scope, 'burst');
    assert.ok(r.retryAfterSec >= 1 && r.retryAfterSec <= 60 + 30);
    assert.match(r.message, /muitas mensagens em pouco tempo/);
  }
});

test('mensagens fora da janela de 10 min não entram na rajada', () => {
  const old = Array.from({ length: 40 }, (_, i) => ago(11 * MIN + i * 1000));
  assert.deepEqual(evaluateRateLimit(old, NOW), { ok: true });
});

test('retry-after da rajada aponta para a 30ª mais recente, não a mais antiga', () => {
  // 35 msgs na janela; a 30ª mais recente está a 8 min => libera em ~2 min.
  const recent = Array.from({ length: 29 }, (_, i) => ago(i * 1000));
  const blocker = ago(8 * MIN);
  const older = Array.from({ length: 5 }, (_, i) => ago(9 * MIN + i * 1000));
  const r = evaluateRateLimit([...recent, blocker, ...older], NOW);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(Math.abs(r.retryAfterSec - 2 * 60) <= 1);
});

test('200 mensagens em 24h: bloqueia o dia mesmo sem rajada', () => {
  const day = Array.from({ length: RATE_LIMITS.daily.max }, (_, i) =>
    ago(11 * MIN + i * 60_000),
  );
  const r = evaluateRateLimit(day, NOW);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.scope, 'daily');
    assert.match(r.message, /200 mensagens por dia/);
    assert.ok(r.retryAfterSec > 0);
  }
});

test('199 em 24h ainda libera; a mensagem de 25h atrás não conta', () => {
  const day = Array.from({ length: 199 }, (_, i) => ago(11 * MIN + i * 60_000));
  assert.deepEqual(evaluateRateLimit(day, NOW), { ok: true });
  assert.deepEqual(
    evaluateRateLimit([...day, ago(25 * 60 * MIN)], NOW),
    { ok: true },
  );
});

test('datas inválidas ou no futuro são ignoradas', () => {
  const junk = ['lixo', '', new Date(NOW.getTime() + 5 * MIN).toISOString()];
  assert.deepEqual(evaluateRateLimit(junk, NOW), { ok: true });
});
