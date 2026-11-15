import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decideConnectionAction,
  isConnectionUpdateEvent,
  parseConnectionUpdate,
} from './connection-event';

test('isConnectionUpdateEvent aceita as duas grafias do evento', () => {
  assert.equal(isConnectionUpdateEvent('connection.update'), true);
  assert.equal(isConnectionUpdateEvent('CONNECTION_UPDATE'), true);
  assert.equal(isConnectionUpdateEvent('messages.upsert'), false);
  assert.equal(isConnectionUpdateEvent(undefined), false);
});

test('parseConnectionUpdate lê instância, estado e motivo', () => {
  const r = parseConnectionUpdate({
    event: 'connection.update',
    instance: 'iazen_1',
    data: { instance: 'iazen_1', state: 'close', statusReason: 401 },
  });
  assert.deepEqual(r, { instance: 'iazen_1', state: 'close', statusReason: 401 });
});

test('parseConnectionUpdate aceita data em array e instância só no data', () => {
  const r = parseConnectionUpdate({ data: [{ instance: 'iazen_2', state: 'open' }] });
  assert.deepEqual(r, { instance: 'iazen_2', state: 'open', statusReason: undefined });
});

test('parseConnectionUpdate devolve null sem instância e ignora estado estranho', () => {
  assert.equal(parseConnectionUpdate(null), null);
  assert.equal(parseConnectionUpdate({ data: { state: 'close' } }), null);
  const r = parseConnectionUpdate({ instance: 'x', data: { state: 'banana' } });
  assert.equal(r?.state, undefined);
});

test('decideConnectionAction: close definitivo avisa, incerto confirma', () => {
  assert.equal(decideConnectionAction({ state: 'close', statusReason: 401 }, true), 'disconnected');
  assert.equal(decideConnectionAction({ state: 'close', statusReason: 440 }, true), 'disconnected');
  assert.equal(decideConnectionAction({ state: 'close', statusReason: 428 }, true), 'confirm');
  assert.equal(decideConnectionAction({ state: 'close', statusReason: undefined }, true), 'confirm');
});

test('decideConnectionAction: não avisa se já estava desconectado', () => {
  assert.equal(decideConnectionAction({ state: 'close', statusReason: 401 }, false), 'ignore');
});

test('decideConnectionAction: open restaura só quando estava desconectado', () => {
  assert.equal(decideConnectionAction({ state: 'open', statusReason: undefined }, false), 'reconnected');
  assert.equal(decideConnectionAction({ state: 'open', statusReason: undefined }, true), 'ignore');
  assert.equal(decideConnectionAction({ state: 'connecting', statusReason: undefined }, true), 'ignore');
});
