import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { formatOperatorLine, getPrivacyContact } from './legal';

test('sem variáveis, não há linha de operadora', () => {
  assert.equal(formatOperatorLine(getPrivacyContact({})), null);
});

test('com variáveis, monta a linha completa', () => {
  const c = getPrivacyContact({
    PRIVACY_CONTROLLER_NAME: ' IAzen Ltda ',
    PRIVACY_CONTROLLER_DOC: 'CNPJ 00.000.000/0001-00',
    PRIVACY_CONTACT_EMAIL: 'privacidade@exemplo.com',
  });
  assert.equal(
    formatOperatorLine(c),
    'Operadora: IAzen Ltda, CNPJ 00.000.000/0001-00, contato: privacidade@exemplo.com.',
  );
});

// Trava: nenhum texto provisório ("[email do DPO]", "preencha os campos entre
// colchetes", "Documento-base") pode chegar a uma página do app.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

test('páginas sem texto provisório', () => {
  const bad = /\[(raz[aã]o social|e-?mail [^\]]*|n[ºo°]|nome [^\]]*|cnpj|cpf|endere[cç]o|preencher|a preencher)\]|entre colchetes|Documento-base|lorem ipsum/i;
  const offenders = ['app', 'components']
    .flatMap((d) => walk(d))
    .filter((f) => readFileSync(f, 'utf8').split('\n').some((line) => !line.trim().startsWith('//') && bad.test(line)));
  assert.deepEqual(offenders, []);
});
