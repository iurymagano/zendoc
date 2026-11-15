// Rodar: npm test  (node:test via tsx).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  attendanceStats,
  formatDuration,
  latestByPhone,
  relativeTime,
  snippet,
  timeSavedEstimate,
  todaySummary,
  upcomingGroups,
  weekMetrics,
  type DashAppointment,
} from './summary';

// sábado, 14/11/2026, 16:57 em São Paulo
const NOW = new Date('2026-11-14T16:57:00-03:00');

let n = 0;
function appt(over: Partial<DashAppointment> & { at: string; mins?: number }): DashAppointment {
  const { at, mins = 50, ...rest } = over;
  const start = new Date(`${at}-03:00`);
  return {
    id: `a${++n}`,
    patient_name: 'Cliente',
    patient_phone: '5511999990000',
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + mins * 60_000).toISOString(),
    status: 'scheduled',
    booked_via: 'manual',
    service_id: null,
    ...rest,
  };
}

test('todaySummary: conta só o dia de São Paulo, separa pessoal e acha o próximo', () => {
  const list = [
    appt({ at: '2026-11-14T09:00:00' }), // já terminou
    appt({ at: '2026-11-14T16:30:00' }), // em andamento (16:30–17:20)
    appt({ at: '2026-11-14T18:00:00' }), // próximo
    appt({ at: '2026-11-14T19:00:00', patient_phone: '' }), // pessoal
    appt({ at: '2026-11-14T20:00:00', status: 'cancelled' }),
    appt({ at: '2026-11-15T09:00:00' }), // amanhã
    // 23:30 em SP = 02:30 UTC do dia seguinte: ainda é hoje em SP
    appt({ at: '2026-11-14T23:30:00', mins: 20 }),
  ];
  const t = todaySummary(list, NOW);
  assert.equal(t.clientCount, 4);
  assert.equal(t.personalCount, 1);
  assert.equal(t.doneCount, 1);
  assert.equal(t.current?.starts_at, list[1].starts_at);
  assert.equal(t.next?.starts_at, list[2].starts_at);
});

test('todaySummary: dia vazio', () => {
  const t = todaySummary([], NOW);
  assert.equal(t.clientCount, 0);
  assert.equal(t.next, null);
  assert.equal(t.current, null);
});

test('upcomingGroups: agrupa por dia, ignora cancelados e passados, respeita o limite', () => {
  const list = [
    appt({ at: '2026-11-14T08:00:00' }), // passou
    appt({ at: '2026-11-14T16:30:00' }), // em andamento: entra
    appt({ at: '2026-11-14T18:00:00', status: 'cancelled' }),
    appt({ at: '2026-11-15T09:00:00' }),
    appt({ at: '2026-11-15T10:00:00', status: 'pending_approval' }),
    appt({ at: '2026-11-18T10:00:00' }),
    appt({ at: '2026-11-19T10:00:00' }),
  ];
  const g = upcomingGroups(list, NOW, 4);
  assert.deepEqual(g.map((x) => x.label), ['Hoje', 'Amanhã', 'qua, 18/11']);
  assert.deepEqual(g.map((x) => x.items.length), [1, 2, 1]);
});

test('weekMetrics: semana de segunda a domingo, sem pessoais nem cancelados, conta a IA', () => {
  const list = [
    appt({ at: '2026-11-08T10:00:00' }), // domingo anterior: fora
    appt({ at: '2026-11-09T10:00:00', booked_via: 'whatsapp_ai' }),
    appt({ at: '2026-11-10T10:00:00', booked_via: 'whatsapp_ai', status: 'confirmed' }),
    appt({ at: '2026-11-11T10:00:00', status: 'cancelled', booked_via: 'whatsapp_ai' }),
    appt({ at: '2026-11-12T10:00:00', patient_phone: '' }),
    appt({ at: '2026-11-15T10:00:00', booked_via: 'whatsapp_ai' }), // domingo: dentro, por vir
    appt({ at: '2026-11-16T10:00:00' }), // segunda seguinte: fora
  ];
  const m = weekMetrics(list, NOW);
  assert.deepEqual(m, { total: 3, byAi: 3, remaining: 1, cancelled: 1 });
});

test('attendanceStats: base, faltas e cancelamentos dos últimos 30 dias', () => {
  const past = (day: string, over: Partial<DashAppointment> = {}) =>
    appt({ at: `2026-11-${day}T10:00:00`, ...over });
  const list = [
    past('01'), past('02'), past('03'), past('04', { status: 'no_show' }),
    past('05', { status: 'confirmed' }), past('06', { status: 'cancelled' }),
    past('07', { patient_phone: '' }), // pessoal: fora
    appt({ at: '2026-11-15T10:00:00' }), // futuro: fora
    appt({ at: '2026-09-01T10:00:00' }), // mais de 30 dias: fora
  ];
  const a = attendanceStats(list, NOW);
  assert.equal(a.held, 5);
  assert.equal(a.noShow, 1);
  assert.equal(a.cancelled, 1);
  assert.equal(a.scheduled, 6);
  assert.equal(a.attendancePct, 80);
  assert.equal(a.cancelPct, 17);
  assert.equal(a.enoughBase, true);
});

test('attendanceStats: sem histórico não inventa taxa', () => {
  const a = attendanceStats([], NOW);
  assert.equal(a.attendancePct, null);
  assert.equal(a.cancelPct, null);
  assert.equal(a.enoughBase, false);
});

test('timeSavedEstimate: mostra a conta e some sem agendamento da IA', () => {
  assert.equal(timeSavedEstimate(0), null);
  const t = timeSavedEstimate(16)!;
  assert.equal(t.minutes, 80);
  assert.equal(t.label, '1h20');
  assert.equal(t.formula, '16 agendamentos pela IA × 5 min');
  assert.equal(timeSavedEstimate(1)!.formula, '1 agendamento pela IA × 5 min');
});

test('formatDuration', () => {
  assert.equal(formatDuration(45), '45 min');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(125), '2h05');
});

test('latestByPhone: um por telefone, o mais recente primeiro, com limite', () => {
  const rows = [
    { patient_phone: '1', role: 'user' as const, content: 'oi', created_at: '2026-11-14T10:00:00Z' },
    { patient_phone: '2', role: 'assistant' as const, content: 'ok', created_at: '2026-11-14T09:00:00Z' },
    { patient_phone: '1', role: 'assistant' as const, content: 'velha', created_at: '2026-11-13T09:00:00Z' },
    { patient_phone: '3', role: 'user' as const, content: 'x', created_at: '2026-11-12T09:00:00Z' },
  ];
  const l = latestByPhone(rows, 2);
  assert.deepEqual(l.map((x) => x.phone), ['1', '2']);
  assert.equal(l[0].last_message, 'oi');
});

test('snippet e relativeTime', () => {
  assert.equal(snippet('a   b\nc'), 'a b c');
  assert.equal(snippet('x'.repeat(100), 10).length, 10);
  assert.equal(relativeTime('2026-11-14T16:56:30-03:00', NOW), 'agora');
  assert.equal(relativeTime('2026-11-14T16:45:00-03:00', NOW), 'há 12 min');
  assert.equal(relativeTime('2026-11-14T09:05:00-03:00', NOW), 'hoje 09:05');
  assert.equal(relativeTime('2026-11-13T22:10:00-03:00', NOW), 'ontem 22:10');
  assert.equal(relativeTime('2026-11-10T22:10:00-03:00', NOW), 'ter, 10/11');
});
