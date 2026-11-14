// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escapeIlike } from './ilike';

test('escapa %, _ e a própria barra invertida', () => {
  assert.equal(escapeIlike('100%'), '100\\%');
  assert.equal(escapeIlike('ana_maria'), 'ana\\_maria');
  assert.equal(escapeIlike('a\\b'), 'a\\\\b');
  assert.equal(escapeIlike('%_\\'), '\\%\\_\\\\');
});

test('nome comum passa intacto (acentos, espaços, apóstrofo)', () => {
  assert.equal(escapeIlike("João D'Ávila"), "João D'Ávila");
  assert.equal(escapeIlike(''), '');
});

test('curinga sozinho não vira "qualquer nome"', () => {
  // "%" puro casaria todos os clientes; escapado só casa um "%" literal.
  assert.equal(escapeIlike('%'), '\\%');
  assert.equal(escapeIlike('_'), '\\_');
});
