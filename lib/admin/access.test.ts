// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAdminEmail } from './access';

test('lista ausente ou vazia: ninguém é admin', () => {
  assert.equal(isAdminEmail('voce@exemplo.com', undefined), false);
  assert.equal(isAdminEmail('voce@exemplo.com', ''), false);
  assert.equal(isAdminEmail('voce@exemplo.com', ' , ,'), false);
});

test('e-mail vazio, nulo ou indefinido nunca é admin', () => {
  assert.equal(isAdminEmail(null, 'voce@exemplo.com'), false);
  assert.equal(isAdminEmail(undefined, 'voce@exemplo.com'), false);
  assert.equal(isAdminEmail('  ', 'voce@exemplo.com'), false);
});

test('ignora maiúsculas e espaços, de ambos os lados', () => {
  assert.equal(isAdminEmail('VOCE@Exemplo.com', 'voce@exemplo.com'), true);
  assert.equal(isAdminEmail('  voce@exemplo.com ', 'VOCE@EXEMPLO.COM'), true);
});

test('aceita vários e-mails separados por vírgula', () => {
  const list = 'a@exemplo.com, voce@exemplo.com ,b@exemplo.com';
  assert.equal(isAdminEmail('voce@exemplo.com', list), true);
  assert.equal(isAdminEmail('b@exemplo.com', list), true);
  assert.equal(isAdminEmail('c@exemplo.com', list), false);
});

test('não casa por pedaço do e-mail', () => {
  assert.equal(isAdminEmail('voce@exemplo.com.br', 'voce@exemplo.com'), false);
  assert.equal(isAdminEmail('xvoce@exemplo.com', 'voce@exemplo.com'), false);
});

test('sem o segundo argumento, lê ADMIN_EMAILS do ambiente', () => {
  const before = process.env.ADMIN_EMAILS;
  try {
    process.env.ADMIN_EMAILS = 'voce@exemplo.com';
    assert.equal(isAdminEmail('voce@exemplo.com'), true);
    delete process.env.ADMIN_EMAILS;
    assert.equal(isAdminEmail('voce@exemplo.com'), false);
  } finally {
    if (before === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = before;
  }
});
