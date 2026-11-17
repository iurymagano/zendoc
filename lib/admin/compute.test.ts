// Rodar: npm test  (node:test via tsx; os testes de data rodam com TZ=UTC)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activeUsersByDay,
  buildFunnel,
  buildUserRows,
  countByKey,
  distinctActiveUsers,
  fillSeries,
  lastNDays,
  latestSeenByUser,
  mrrCents,
  planBucket,
  providerFromMetadata,
  summarizePlans,
  sumVisits,
  tallyByDay,
  todaySp,
  visitsByDay,
} from './compute';

// 2026-11-17 (terça) 10:00 em São Paulo = 13:00 UTC.
const NOW = new Date('2026-11-17T13:00:00Z');

test('todaySp usa o dia de São Paulo, não o do servidor (UTC)', () => {
  // 01:30 UTC de 18/11 ainda é 22:30 de 17/11 em São Paulo.
  assert.equal(todaySp(new Date('2026-11-18T01:30:00Z')), '2026-11-17');
  assert.equal(todaySp(NOW), '2026-11-17');
});

test('lastNDays devolve n dias terminando hoje, atravessando mês e ano', () => {
  assert.deepEqual(lastNDays('2026-11-17', 3), ['2026-11-15', '2026-11-16', '2026-11-17']);
  const days = lastNDays('2027-01-02', 5);
  assert.deepEqual(days, ['2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  assert.equal(lastNDays('2026-11-17', 30).length, 30);
});

test('tallyByDay agrupa pelo dia de São Paulo e ignora vazios/inválidos', () => {
  const t = tallyByDay([
    '2026-11-17T02:59:00Z', // 16/11 23:59 em SP
    '2026-11-17T03:00:00Z', // 17/11 00:00 em SP
    '2026-11-17T20:00:00Z',
    null,
    'lixo',
  ]);
  assert.deepEqual(t, { '2026-11-16': 1, '2026-11-17': 2 });
});

test('fillSeries preenche com 0 os dias sem dado', () => {
  const s = fillSeries(['2026-11-15', '2026-11-16', '2026-11-17'], { '2026-11-16': 4 });
  assert.deepEqual(s, [
    { day: '2026-11-15', value: 0 },
    { day: '2026-11-16', value: 4 },
    { day: '2026-11-17', value: 0 },
  ]);
});

test('planBucket separa teste vencido do teste válido', () => {
  assert.equal(planBucket('trialing', '2026-11-20T00:00:00Z', NOW), 'trialing');
  assert.equal(planBucket('trialing', '2026-11-10T00:00:00Z', NOW), 'trialExpired');
  assert.equal(planBucket('trialing', null, NOW), 'trialing');
  assert.equal(planBucket('active', null, NOW), 'active');
  assert.equal(planBucket('past_due', null, NOW), 'pastDue');
  assert.equal(planBucket('cancelled', null, NOW), 'cancelled');
  assert.equal(planBucket(null, null, NOW), 'none');
});

test('summarizePlans conta cada faixa e o WhatsApp conectado', () => {
  const s = summarizePlans(
    [
      { plan_status: 'trialing', trial_ends_at: '2026-11-25T00:00:00Z', whatsapp_connected: true },
      { plan_status: 'trialing', trial_ends_at: '2026-11-01T00:00:00Z', whatsapp_connected: false },
      { plan_status: 'active', trial_ends_at: null, whatsapp_connected: true },
      { plan_status: 'active', trial_ends_at: null, whatsapp_connected: true },
      { plan_status: 'past_due', trial_ends_at: null, whatsapp_connected: false },
      { plan_status: 'cancelled', trial_ends_at: null, whatsapp_connected: false },
    ],
    NOW,
  );
  assert.deepEqual(s, {
    trialing: 1,
    trialExpired: 1,
    paying: 2,
    pastDue: 1,
    cancelled: 1,
    whatsappConnected: 3,
  });
});

test('mrrCents = pagantes x R$297 em centavos', () => {
  assert.equal(mrrCents(0), 0);
  assert.equal(mrrCents(3), 89100);
  assert.equal(mrrCents(2, 1000), 2000);
});

test('usuários ativos: distintos na janela e por dia', () => {
  const rows = [
    { user_id: 'a', day: '2026-11-17' },
    { user_id: 'b', day: '2026-11-17' },
    { user_id: 'a', day: '2026-11-12' },
    { user_id: 'c', day: '2026-10-01' },
  ];
  assert.equal(distinctActiveUsers(rows, '2026-11-17', '2026-11-17'), 2);
  assert.equal(distinctActiveUsers(rows, '2026-11-11', '2026-11-17'), 2);
  assert.equal(distinctActiveUsers(rows, '2026-10-19', '2026-11-17'), 2);
  assert.equal(distinctActiveUsers(rows, '2026-10-01', '2026-11-17'), 3);
  assert.deepEqual(activeUsersByDay(rows), { '2026-11-17': 2, '2026-11-12': 1, '2026-10-01': 1 });
});

test('visitas: soma por caminho e janela, e série por dia', () => {
  const v = [
    { day: '2026-11-17', path: '/', visits: 10 },
    { day: '2026-11-16', path: '/', visits: 5 },
    { day: '2026-11-17', path: '/register', visits: 3 },
    { day: '2026-10-01', path: '/', visits: 99 },
  ];
  assert.equal(sumVisits(v, '/', '2026-11-01', '2026-11-17'), 15);
  assert.equal(sumVisits(v, '/register', '2026-11-01', '2026-11-17'), 3);
  assert.equal(sumVisits(v, '/login', '2026-11-01', '2026-11-17'), 0);
  assert.deepEqual(visitsByDay(v, '/'), { '2026-11-17': 10, '2026-11-16': 5, '2026-10-01': 99 });
});

test('buildFunnel conta só o período e usa o dia de São Paulo', () => {
  const f = buildFunnel({
    visits: [
      { day: '2026-11-17', path: '/', visits: 100 },
      { day: '2026-11-17', path: '/register', visits: 20 },
      { day: '2026-09-01', path: '/', visits: 500 },
    ],
    signupTimestamps: ['2026-11-10T12:00:00Z', '2026-11-17T12:00:00Z', '2026-09-01T12:00:00Z'],
    professionals: [
      { created_at: '2026-11-10T12:00:00Z', plan_status: 'active', trial_ends_at: null, whatsapp_connected: true },
      { created_at: '2026-11-11T12:00:00Z', plan_status: 'trialing', trial_ends_at: null, whatsapp_connected: true },
      { created_at: '2026-11-12T12:00:00Z', plan_status: 'trialing', trial_ends_at: null, whatsapp_connected: false },
      { created_at: '2026-09-01T12:00:00Z', plan_status: 'active', trial_ends_at: null, whatsapp_connected: true },
    ],
    fromDay: '2026-10-19',
    toDay: '2026-11-17',
  });
  assert.deepEqual(f, {
    landingVisits: 100,
    registerVisits: 20,
    signups: 2,
    onboarded: 3,
    whatsappConnected: 2,
    paying: 1,
  });
});

test('providerFromMetadata lê provider/providers do app_metadata', () => {
  assert.equal(providerFromMetadata({ provider: 'google', providers: ['google'] }), 'google');
  assert.equal(providerFromMetadata({ provider: 'email', providers: ['email'] }), 'email');
  assert.equal(providerFromMetadata({ providers: ['email', 'google'] }), 'google');
  assert.equal(providerFromMetadata({ provider: 'github' }), null);
  assert.equal(providerFromMetadata(null), null);
  assert.equal(providerFromMetadata(undefined), null);
});

test('latestSeenByUser e countByKey', () => {
  assert.deepEqual(
    latestSeenByUser([
      { user_id: 'a', last_seen_at: '2026-11-10T10:00:00Z' },
      { user_id: 'a', last_seen_at: '2026-11-12T10:00:00Z' },
      { user_id: 'b', last_seen_at: '2026-11-01T10:00:00Z' },
    ]),
    { a: '2026-11-12T10:00:00Z', b: '2026-11-01T10:00:00Z' },
  );
  assert.deepEqual(countByKey([{ professional_id: 'p1' }, { professional_id: 'p1' }, { professional_id: 'p2' }]), {
    p1: 2,
    p2: 1,
  });
});

test('buildUserRows junta conta e profissional, mais recentes primeiro', () => {
  const rows = buildUserRows({
    users: [
      { id: 'u1', email: 'a@exemplo.com', created_at: '2026-11-01T10:00:00Z', app_metadata: { provider: 'google' } },
      { id: 'u2', email: 'b@exemplo.com', created_at: '2026-11-15T10:00:00Z', app_metadata: { provider: 'email' } },
      { id: 'u3', email: null, created_at: '2026-11-10T10:00:00Z' },
    ],
    professionals: [
      {
        id: 'p1',
        user_id: 'u1',
        name: 'Ana',
        specialty: 'Barbeira',
        phone: '5511999999999',
        plan_status: 'active',
        trial_ends_at: null,
        whatsapp_connected: true,
        ai_enabled: true,
      },
    ],
    lastSeen: { u1: '2026-11-16T10:00:00Z' },
    appointments30d: { p1: 7 },
  });
  assert.deepEqual(rows.map((r) => r.userId), ['u2', 'u3', 'u1']);
  const ana = rows[2];
  assert.equal(ana.name, 'Ana');
  assert.equal(ana.planStatus, 'active');
  assert.equal(ana.appointments30d, 7);
  assert.equal(ana.lastSeenAt, '2026-11-16T10:00:00Z');
  assert.equal(ana.provider, 'google');
  const semOnboarding = rows[0];
  assert.equal(semOnboarding.professionalId, null);
  assert.equal(semOnboarding.planStatus, null);
  assert.equal(semOnboarding.lastSeenAt, null);
  assert.equal(semOnboarding.appointments30d, 0);
  assert.equal(rows[1].email, '');
});
