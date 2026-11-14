// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DECLARATION_MESSAGES, declarationEligibility } from './declaration';

const NOW = new Date('2026-11-18T15:00:00-03:00');

test('atendimento que já começou e não foi cancelado: emite', () => {
  for (const status of ['scheduled', 'confirmed', 'pending_approval']) {
    assert.deepEqual(
      declarationEligibility({ starts_at: '2026-11-18T10:00:00-03:00', status }, NOW),
      { ok: true },
    );
  }
});

test('atendimento no futuro: não emite, avisa que fica disponível depois', () => {
  const r = declarationEligibility(
    { starts_at: '2026-11-19T10:00:00-03:00', status: 'scheduled' },
    NOW,
  );
  assert.deepEqual(r, { ok: false, reason: 'future', message: DECLARATION_MESSAGES.future });
  assert.match(DECLARATION_MESSAGES.future, /depois do atendimento/);
});

test('começa exatamente agora: já pode emitir (sessão em curso)', () => {
  assert.deepEqual(
    declarationEligibility({ starts_at: NOW.toISOString(), status: 'confirmed' }, NOW),
    { ok: true },
  );
});

test('cancelado ou falta: nunca emite, mesmo no passado', () => {
  const past = '2026-11-10T10:00:00-03:00';
  const c = declarationEligibility({ starts_at: past, status: 'cancelled' }, NOW);
  const n = declarationEligibility({ starts_at: past, status: 'no_show' }, NOW);
  assert.equal(c.ok, false);
  assert.equal(n.ok, false);
  if (!c.ok) assert.equal(c.reason, 'cancelled');
  if (!n.ok) assert.equal(n.reason, 'no_show');
});

test('cancelado no futuro reporta cancelado (motivo mais específico)', () => {
  const r = declarationEligibility(
    { starts_at: '2026-12-01T10:00:00-03:00', status: 'cancelled' },
    NOW,
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'cancelled');
});
