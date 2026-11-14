import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPersonalCommitment, resolvePhonePatch } from './personal';

test('isPersonalCommitment: vazio, nulo e só símbolos são pessoais', () => {
  assert.equal(isPersonalCommitment(''), true);
  assert.equal(isPersonalCommitment('   '), true);
  assert.equal(isPersonalCommitment('()-'), true);
  assert.equal(isPersonalCommitment(null), true);
  assert.equal(isPersonalCommitment(undefined), true);
  assert.equal(isPersonalCommitment('5511999998888'), false);
});

test('resolvePhonePatch: campo ausente não muda nada', () => {
  assert.deepEqual(resolvePhonePatch(undefined, ''), { ok: true, value: undefined });
  assert.deepEqual(resolvePhonePatch(undefined, '5511999998888'), {
    ok: true,
    value: undefined,
  });
});

test('resolvePhonePatch: compromisso pessoal aceita telefone vazio', () => {
  assert.deepEqual(resolvePhonePatch('', ''), { ok: true, value: undefined });
  assert.deepEqual(resolvePhonePatch('  ', ''), { ok: true, value: undefined });
});

test('resolvePhonePatch: compromisso pessoal recusa telefone preenchido', () => {
  const r = resolvePhonePatch('11999998888', '');
  assert.equal(r.ok, false);
});

test('resolvePhonePatch: atendimento de cliente normaliza telefone válido', () => {
  assert.deepEqual(resolvePhonePatch('(11) 99999-8888', '5511911112222'), {
    ok: true,
    value: '5511999998888',
  });
});

test('resolvePhonePatch: atendimento de cliente exige telefone válido', () => {
  assert.equal(resolvePhonePatch('', '5511911112222').ok, false);
  assert.equal(resolvePhonePatch('123', '5511911112222').ok, false);
});
