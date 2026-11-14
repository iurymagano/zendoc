// Rodar: npm test  (node:test via tsx — sem framework instalado no projeto)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR } from './phone';

test('normalizePhoneBR prefixa 55 quando falta o DDI', () => {
  assert.equal(normalizePhoneBR('(11) 91111-2222'), '5511911112222');
  assert.equal(normalizePhoneBR('11911112222'), '5511911112222');
  assert.equal(normalizePhoneBR('(11) 3333-4444'), '551133334444');
});

test('normalizePhoneBR mantém números que já têm DDI', () => {
  assert.equal(normalizePhoneBR('5511911112222'), '5511911112222');
  assert.equal(normalizePhoneBR('+55 (11) 91111-2222'), '5511911112222');
  assert.equal(normalizePhoneBR('551133334444'), '551133334444');
});

test('normalizePhoneBR remove zero de tronco e é idempotente', () => {
  assert.equal(normalizePhoneBR('011 91111-2222'), '5511911112222');
  const once = normalizePhoneBR('(11) 91111-2222');
  assert.equal(normalizePhoneBR(once), once);
});

test('isValidPhoneBR', () => {
  assert.equal(isValidPhoneBR('5511911112222'), true);
  assert.equal(isValidPhoneBR('551133334444'), true);
  assert.equal(isValidPhoneBR('911112222'), false);
  assert.equal(isValidPhoneBR(normalizePhoneBR('abc')), false);
  assert.equal(isValidPhoneBR(''), false);
});

test('formatPhoneBR formata para exibição', () => {
  assert.equal(formatPhoneBR('5511911112222'), '+55 (11) 91111-2222');
  assert.equal(formatPhoneBR('551133334444'), '+55 (11) 3333-4444');
  assert.equal(formatPhoneBR('11911112222'), '(11) 91111-2222');
  assert.equal(formatPhoneBR('123'), '123');
});
