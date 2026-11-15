// Rodar: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAddress, EMPTY_ADDRESS, lookupCep, parseAddress } from './address';

const full = {
  cep: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  complement: 'sala 12',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

test('buildAddress monta o texto completo', () => {
  assert.equal(
    buildAddress(full),
    'Avenida Paulista, 1000, sala 12 - Bela Vista, São Paulo/SP, CEP 01310-100',
  );
});

test('buildAddress omite partes vazias', () => {
  assert.equal(buildAddress(EMPTY_ADDRESS), '');
  assert.equal(
    buildAddress({ ...EMPTY_ADDRESS, street: 'Rua A', number: '5' }),
    'Rua A, 5',
  );
  assert.equal(
    buildAddress({ ...EMPTY_ADDRESS, city: 'Florianópolis', state: 'sc', cep: '88010400' }),
    'Florianópolis/SC, CEP 88010-400',
  );
  assert.equal(buildAddress({ ...EMPTY_ADDRESS, neighborhood: 'Centro' }), 'Centro');
  assert.equal(
    buildAddress({ ...full, complement: '', number: '' }),
    'Avenida Paulista - Bela Vista, São Paulo/SP, CEP 01310-100',
  );
});

test('parseAddress separa o formato gerado (sem complemento)', () => {
  const text = 'Rua A, 5 - Centro, Florianópolis/SC, CEP 88010-400';
  const p = parseAddress(text);
  assert.ok(p);
  assert.equal(p.street, 'Rua A');
  assert.equal(p.number, '5');
  assert.equal(p.neighborhood, 'Centro');
  assert.equal(p.city, 'Florianópolis');
  assert.equal(p.state, 'SC');
  assert.equal(buildAddress(p), text);
});

test('parseAddress devolve null quando não dá para separar com segurança', () => {
  assert.equal(parseAddress('Rua das Flores 12, centro, Itajaí'), null);
  assert.equal(parseAddress(''), null);
  assert.equal(
    parseAddress('Avenida Paulista, 1000, sala 12 - Bela Vista, São Paulo/SP, CEP 01310-100'),
    null,
  );
});

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response) as typeof fetch;
}

test('lookupCep: sucesso, não encontrado, inválido e rede', async () => {
  const ok = await lookupCep('01310-100', {
    fetchImpl: fakeFetch(200, {
      logradouro: 'Avenida Paulista',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    }),
  });
  assert.deepEqual(ok, {
    ok: true,
    street: 'Avenida Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  });
  assert.deepEqual(await lookupCep('99999999', { fetchImpl: fakeFetch(200, { erro: true }) }), {
    ok: false,
    reason: 'not_found',
  });
  assert.deepEqual(await lookupCep('99999999', { fetchImpl: fakeFetch(200, { erro: 'true' }) }), {
    ok: false,
    reason: 'not_found',
  });
  assert.deepEqual(await lookupCep('123'), { ok: false, reason: 'invalid' });
  assert.deepEqual(await lookupCep('12345678', { fetchImpl: fakeFetch(400, {}) }), {
    ok: false,
    reason: 'invalid',
  });
  assert.deepEqual(await lookupCep('12345678', { fetchImpl: fakeFetch(500, {}) }), {
    ok: false,
    reason: 'network',
  });
  const boom = (async () => {
    throw new Error('offline');
  }) as typeof fetch;
  assert.deepEqual(await lookupCep('12345678', { fetchImpl: boom }), {
    ok: false,
    reason: 'network',
  });
});
