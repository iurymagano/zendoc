// Rodar: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  caretAfterDigits,
  formatCentsBRL,
  maskCep,
  maskCpf,
  maskCurrency,
  maskPhone,
  parseCurrencyToCents,
} from './masks';
import { normalizePhoneBR } from './phone';

test('maskPhone formata progressivamente celular (11) e fixo (10)', () => {
  assert.equal(maskPhone(''), '');
  assert.equal(maskPhone('4'), '(4');
  assert.equal(maskPhone('48'), '(48');
  assert.equal(maskPhone('489'), '(48) 9');
  assert.equal(maskPhone('48985'), '(48) 985');
  assert.equal(maskPhone('4898506'), '(48) 9850-6');
  assert.equal(maskPhone('4833334444'), '(48) 3333-4444');
  assert.equal(maskPhone('48985069930'), '(48) 98506-9930');
});

test('maskPhone aceita o formato salvo (DDI 55) e é idempotente', () => {
  assert.equal(maskPhone('5548985069930'), '(48) 98506-9930');
  assert.equal(maskPhone('554833334444'), '(48) 3333-4444');
  assert.equal(maskPhone('+55 (48) 98506-9930'), '(48) 98506-9930');
  const once = maskPhone('48985069930');
  assert.equal(maskPhone(once), once);
});

test('maskPhone respeita o DDD 55 e o limite de 11 dígitos', () => {
  assert.equal(maskPhone('55999998888'), '(55) 99999-8888');
  assert.equal(maskPhone('489850699301234'), '+489850699301234');
  assert.equal(maskPhone('(48) 98506-9930', undefined), '(48) 98506-9930');
});

test('maskPhone ignora o 12º dígito digitado depois de um telefone completo', () => {
  assert.equal(maskPhone('(55) 99999-88881', '(55) 99999-8888'), '(55) 99999-8888');
});

test('maskPhone mantém telefone internacional sem adulterar', () => {
  assert.equal(maskPhone('4915112345678'), '+4915112345678');
});

test('maskPhone remove zero de tronco', () => {
  assert.equal(maskPhone('048985069930'), '(48) 98506-9930');
});

test('maskPhone + normalizePhoneBR → formato salvo', () => {
  assert.equal(normalizePhoneBR(maskPhone('48985069930')), '5548985069930');
  assert.equal(normalizePhoneBR(maskPhone('4833334444')), '554833334444');
});

test('maskCpf e maskCep', () => {
  assert.equal(maskCpf('12345678909'), '123.456.789-09');
  assert.equal(maskCpf('123456'), '123.456');
  assert.equal(maskCep('01310100'), '01310-100');
  assert.equal(maskCep('0131'), '0131');
  assert.equal(maskCep('01310-1009999'), '01310-100');
});

test('maskCurrency digita pelos centavos', () => {
  assert.equal(maskCurrency(''), '');
  assert.equal(maskCurrency('1'), 'R$ 0,01');
  assert.equal(maskCurrency('150'), 'R$ 1,50');
  assert.equal(maskCurrency('15000'), 'R$ 150,00');
  assert.equal(maskCurrency('123456789'), 'R$ 1.234.567,89');
  assert.equal(maskCurrency('R$ 150,005'), 'R$ 1.500,05');
});

test('maskCurrency: zero e apagar até limpar', () => {
  assert.equal(maskCurrency('0'), 'R$ 0,00');
  assert.equal(maskCurrency('R$ 0,0', 'R$ 0,00'), '');
  assert.equal(maskCurrency('R$ 0,0', 'R$ 0,05'), '');
  assert.equal(maskCurrency('R$ 1,5', 'R$ 1,50'), 'R$ 0,15');
});

test('formatCentsBRL e parseCurrencyToCents fecham o ciclo', () => {
  assert.equal(formatCentsBRL(15000), 'R$ 150,00');
  assert.equal(formatCentsBRL(123456), 'R$ 1.234,56');
  assert.equal(formatCentsBRL(0), 'R$ 0,00');
  assert.equal(formatCentsBRL(null), '');
  assert.equal(parseCurrencyToCents('R$ 1.234,56'), 123456);
  assert.equal(parseCurrencyToCents('R$ 0,05'), 5);
  assert.equal(parseCurrencyToCents(''), null);
  assert.equal(parseCurrencyToCents(formatCentsBRL(9990)), 9990);
});

test('parseCurrencyToCents aceita texto solto', () => {
  assert.equal(parseCurrencyToCents('150'), 15000);
  assert.equal(parseCurrencyToCents('150,5'), 15050);
  assert.equal(parseCurrencyToCents('150.50'), 15050);
  assert.equal(parseCurrencyToCents('1.500'), 150000);
  assert.equal(parseCurrencyToCents('abc'), null);
});

test('caretAfterDigits acha o cursor depois do n-ésimo dígito', () => {
  assert.equal(caretAfterDigits('(48) 98506-9930', 0), 0);
  assert.equal(caretAfterDigits('(48) 98506-9930', 1), 2);
  assert.equal(caretAfterDigits('(48) 98506-9930', 2), 3);
  assert.equal(caretAfterDigits('(48) 98506-9930', 3), 6);
  assert.equal(caretAfterDigits('(48) 98506-9930', 11), 15);
  assert.equal(caretAfterDigits('(48', 9), 3);
});
