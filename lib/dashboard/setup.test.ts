// Rodar: npm test  (node:test via tsx).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSetup, greeting, trialInfo } from './setup';

test('greeting: pelo relógio de São Paulo, não do servidor', () => {
  assert.equal(greeting(new Date('2026-11-14T07:00:00-03:00')), 'Bom dia');
  assert.equal(greeting(new Date('2026-11-14T12:00:00-03:00')), 'Boa tarde');
  assert.equal(greeting(new Date('2026-11-14T17:59:00-03:00')), 'Boa tarde');
  assert.equal(greeting(new Date('2026-11-14T21:00:00-03:00')), 'Boa noite');
  assert.equal(greeting(new Date('2026-11-14T03:00:00-03:00')), 'Boa noite');
});

test('buildSetup: conta nova, parcial e completa', () => {
  const fresh = buildSetup({ whatsappConnected: false, weeklyBlocks: 0, services: 0, googleConnected: false });
  assert.equal(fresh.doneCount, 0);
  assert.equal(fresh.pct, 0);
  assert.equal(fresh.next?.key, 'whatsapp');
  assert.equal(fresh.essentialDone, false);

  const partial = buildSetup({ whatsappConnected: true, weeklyBlocks: 3, services: 0, googleConnected: false });
  assert.equal(partial.pct, 50);
  assert.equal(partial.essentialDone, true);
  assert.equal(partial.next?.key, 'services');
  assert.equal(partial.complete, false);

  const full = buildSetup({ whatsappConnected: true, weeklyBlocks: 3, services: 2, googleConnected: true });
  assert.equal(full.complete, true);
  assert.equal(full.next, null);
});

test('trialInfo: só para quem está em teste', () => {
  const now = new Date('2026-11-14T12:00:00-03:00');
  assert.equal(trialInfo('active', '2026-11-20T12:00:00-03:00', now), null);
  assert.equal(trialInfo('trialing', null, now), null);
  assert.deepEqual(trialInfo('trialing', '2026-11-20T12:00:00-03:00', now), { daysLeft: 6, ended: false });
  assert.deepEqual(trialInfo('trialing', '2026-11-14T18:00:00-03:00', now), { daysLeft: 1, ended: false });
  assert.deepEqual(trialInfo('trialing', '2026-11-13T12:00:00-03:00', now), { daysLeft: 0, ended: true });
});
