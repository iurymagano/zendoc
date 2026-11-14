// Rodar: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { firstNameSkippingTitle } from './name';

test('pula títulos com e sem ponto', () => {
  assert.equal(firstNameSkippingTitle('Dra. Teste QA'), 'Teste');
  assert.equal(firstNameSkippingTitle('dr Carlos Lima'), 'Carlos');
  assert.equal(firstNameSkippingTitle('Profa. Ana'), 'Ana');
  assert.equal(firstNameSkippingTitle('Dr. Prof. João'), 'João');
});

test('sem título devolve a primeira palavra', () => {
  assert.equal(firstNameSkippingTitle('Maria Souza'), 'Maria');
});

test('só título ou vazio não quebra', () => {
  assert.equal(firstNameSkippingTitle('Dra.'), 'Dra.');
  assert.equal(firstNameSkippingTitle('  '), '');
});
