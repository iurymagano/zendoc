// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  decidePendingSave,
  formatPendingForPrompt,
  isSamePendingAction,
  type PendingForSave,
  type PendingIdentity,
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

// --- preparar de novo a MESMA ação (bug do PR #2: "Sim, confirmo" re-preparava) ---

const CANCEL: PendingIdentity = {
  kind: 'cancel',
  appointment_id: 'appt-1',
  new_starts_at: null,
  new_ends_at: null,
};
const RESCHEDULE: PendingIdentity = {
  kind: 'reschedule',
  appointment_id: 'appt-1',
  new_starts_at: '2026-11-19T10:00:00-03:00',
  new_ends_at: '2026-11-19T10:50:00-03:00',
};
const saved = (identity: PendingIdentity, over: Partial<PendingForSave> = {}): PendingForSave => ({
  ...identity,
  request_id: 'req-1',
  status: 'pending',
  expires_at: pendingExpiry(new Date(NOW.getTime() - 60_000)).toISOString(),
  ...over,
});

test('isSamePendingAction compara tipo, atendimento e novo horário (por instante)', () => {
  assert.equal(isSamePendingAction(CANCEL, { ...CANCEL }), true);
  assert.equal(isSamePendingAction(CANCEL, { ...CANCEL, appointment_id: 'appt-2' }), false);
  assert.equal(isSamePendingAction(CANCEL, RESCHEDULE), false);
  // mesmo instante em outro offset/formato ainda é a mesma ação
  assert.equal(
    isSamePendingAction(RESCHEDULE, {
      ...RESCHEDULE,
      new_starts_at: '2026-11-19T13:00:00.000Z',
      new_ends_at: '2026-11-19T13:50:00.000Z',
    }),
    true,
  );
  assert.equal(
    isSamePendingAction(RESCHEDULE, { ...RESCHEDULE, new_starts_at: '2026-11-19T11:00:00-03:00' }),
    false,
  );
});

test('repetir o prepare da mesma ação numa mensagem posterior reaproveita (mantém o request_id)', () => {
  const d = decidePendingSave(saved(CANCEL), CANCEL, { requestId: 'req-2', now: NOW });
  assert.deepEqual(d, { action: 'reuse', carriedOver: true });
  // e o request_id original continua o da preparação, então confirmar em req-2 vale:
  assert.deepEqual(checkPendingConfirmable(saved(CANCEL), { requestId: 'req-2', now: NOW }), {
    ok: true,
  });
  assert.deepEqual(
    decidePendingSave(saved(RESCHEDULE), RESCHEDULE, { requestId: 'req-2', now: NOW }),
    { action: 'reuse', carriedOver: true },
  );
});

test('preparar duas vezes na MESMA mensagem reaproveita sem liberar a confirmação', () => {
  const d = decidePendingSave(saved(CANCEL), CANCEL, { requestId: 'req-1', now: NOW });
  assert.deepEqual(d, { action: 'reuse', carriedOver: false });
  // continua recusando confirmar na requisição que preparou
  assert.equal(
    checkPendingConfirmable(saved(CANCEL), { requestId: 'req-1', now: NOW }).ok,
    false,
  );
});

test('ação diferente, vencida, usada ou inexistente: grava uma nova', () => {
  const ctx = { requestId: 'req-2', now: NOW };
  assert.deepEqual(decidePendingSave(null, CANCEL, ctx), { action: 'replace' });
  assert.deepEqual(decidePendingSave(saved(CANCEL), RESCHEDULE, ctx), { action: 'replace' });
  assert.deepEqual(
    decidePendingSave(saved(CANCEL), { ...CANCEL, appointment_id: 'appt-9' }, ctx),
    { action: 'replace' },
  );
  assert.deepEqual(
    decidePendingSave(saved(CANCEL, { status: 'done' }), CANCEL, ctx),
    { action: 'replace' },
  );
  assert.deepEqual(
    decidePendingSave(
      saved(CANCEL, { expires_at: new Date(NOW.getTime() - 1000).toISOString() }),
      CANCEL,
      ctx,
    ),
    { action: 'replace' },
  );
});

test('formatPendingForPrompt manda confirmar (sem preparar de novo) e mostra o resumo', () => {
  const text = formatPendingForPrompt(
    {
      kind: 'cancel',
      summary: 'Cancelar Ana Souza (qua, 19/11 às 10:00)',
      expires_at: '2026-11-18T18:15:00.000Z',
    },
    () => '15:15',
  );
  assert.match(text, /AÇÃO PREPARADA AGUARDANDO CONFIRMAÇÃO \(CANCELAR\)/);
  assert.match(text, /Cancelar Ana Souza \(qua, 19\/11 às 10:00\) \(vale até 15:15\)/);
  assert.match(text, /chame confirm_pending_action/);
  assert.match(text, /NÃO chame prepare_cancel_appointment nem prepare_reschedule_appointment de novo/);
  assert.match(
    formatPendingForPrompt({ kind: 'reschedule', summary: 'x', expires_at: 'y' }, () => 'z'),
    /\(REMARCAR\)/,
  );
});
