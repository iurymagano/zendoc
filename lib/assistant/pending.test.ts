// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EXPIRED_ERROR,
  NO_PENDING_ERROR,
  PENDING_TTL_MS,
  SAME_REQUEST_ERROR,
  checkPendingConfirmable,
  pendingExpiry,
  type PendingForCheck,
} from './pending';

const NOW = new Date('2026-11-18T15:00:00-03:00');
const pending = (over: Partial<PendingForCheck> = {}): PendingForCheck => ({
  request_id: 'req-1',
  status: 'pending',
  expires_at: pendingExpiry(new Date(NOW.getTime() - 60_000)).toISOString(),
  ...over,
});

test('sem ação preparada (ou já usada/substituída) não confirma', () => {
  assert.deepEqual(checkPendingConfirmable(null, { requestId: 'req-2', now: NOW }), {
    ok: false,
    error: NO_PENDING_ERROR,
  });
  for (const status of ['done', 'replaced']) {
    const r = checkPendingConfirmable(pending({ status }), { requestId: 'req-2', now: NOW });
    assert.equal(r.ok, false);
  }
});

test('preparada na MESMA requisição: recusa (usuário ainda não respondeu)', () => {
  const r = checkPendingConfirmable(pending(), { requestId: 'req-1', now: NOW });
  assert.deepEqual(r, { ok: false, error: SAME_REQUEST_ERROR });
});

test('preparada numa requisição anterior e dentro do prazo: confirma', () => {
  const r = checkPendingConfirmable(pending(), { requestId: 'req-2', now: NOW });
  assert.deepEqual(r, { ok: true });
});

test('vencida: recusa mesmo vindo de requisição anterior', () => {
  const expired = pending({
    expires_at: new Date(NOW.getTime() - 1).toISOString(),
  });
  assert.deepEqual(checkPendingConfirmable(expired, { requestId: 'req-2', now: NOW }), {
    ok: false,
    error: EXPIRED_ERROR,
  });
});

test('pendingExpiry soma o TTL e a mensagem de expirado cita 15 minutos', () => {
  assert.equal(pendingExpiry(NOW).getTime() - NOW.getTime(), PENDING_TTL_MS);
  assert.equal(PENDING_TTL_MS, 15 * 60_000);
  assert.match(EXPIRED_ERROR, /15 minutos/);
});
