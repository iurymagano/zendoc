import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBookedNotification,
  buildCancelledNotification,
  buildConfirmedNotification,
  buildConflictNotification,
  buildConversationAttentionNotification,
  buildPendingApprovalNotification,
  buildRescheduledNotification,
  buildReminderFailedNotification,
  buildReplyFailedNotification,
  buildWhatsappDisconnectedNotification,
  clip,
  dedupeKeys,
  displayName,
} from './messages';

// 18/11/2026 14:00 em São Paulo (quarta-feira) = 17:00Z.
const STARTS = '2026-11-18T14:00:00-03:00';
const NEW_STARTS = '2026-11-19T10:30:00-03:00';
const REF = new Date('2026-11-14T12:00:00Z');
const appt = {
  id: 'a1',
  patientName: 'Marina Souza',
  patientPhone: '5511999998888',
  startsAt: STARTS,
  serviceName: 'Corte',
};

test('clip: normaliza espaços e corta com reticências', () => {
  assert.equal(clip('  oi   tudo   bem ', 50), 'oi tudo bem');
  assert.equal(clip('abcdefghij', 5), 'abcd…');
  assert.equal(clip(null, 5), '');
});

test('displayName: usa fallback quando o nome vem vazio', () => {
  assert.equal(displayName('  '), 'Um cliente');
  assert.equal(displayName(undefined), 'Um cliente');
  assert.equal(displayName('Marina'), 'Marina');
});

test('cancelado pelo cliente: não lida, com data e serviço no fuso de SP', () => {
  const n = buildCancelledNotification({ appointment: appt, actor: 'patient', ref: REF });
  assert.equal(n.type, 'appointment_cancelled');
  assert.equal(n.title, 'Marina Souza desmarcou');
  assert.equal(n.body, 'qua, 18/11 às 14:00 · Corte. O horário voltou a ficar livre.');
  assert.equal(n.alreadyRead, false);
  assert.equal(n.dedupeKey, 'cancelled:a1');
  assert.deepEqual(n.data, {
    appointment_id: 'a1',
    starts_at: STARTS,
    patient_phone: '5511999998888',
    actor: 'patient',
  });
});

test('cancelado pelo profissional ou pelo Assistente: já nasce lido', () => {
  const pro = buildCancelledNotification({ appointment: appt, actor: 'professional', ref: REF });
  assert.equal(pro.alreadyRead, true);
  assert.equal(pro.title, 'Você cancelou o atendimento de Marina Souza');

  const ai = buildCancelledNotification({ appointment: appt, actor: 'assistant', ref: REF });
  assert.equal(ai.alreadyRead, true);
  assert.match(ai.title, /^O Assistente cancelou/);
  assert.match(ai.body, /O cliente não foi avisado/);
});

test('cancelado: motivo entra no corpo, cortado', () => {
  const n = buildCancelledNotification({
    appointment: { ...appt, serviceName: null },
    actor: 'patient',
    reason: 'Surgiu um imprevisto no trabalho',
    ref: REF,
  });
  assert.match(n.body, /Motivo: Surgiu um imprevisto no trabalho$/);
  assert.doesNotMatch(n.body, /· /);
});

test('ano só aparece quando não é o ano corrente', () => {
  const n = buildCancelledNotification({
    appointment: { ...appt, startsAt: '2027-01-05T09:00:00-03:00' },
    actor: 'patient',
    ref: REF,
  });
  assert.match(n.body, /ter, 05\/01\/2027 às 09:00/);
});

test('hora perto da meia-noite UTC continua no dia certo de SP', () => {
  const n = buildCancelledNotification({
    appointment: { ...appt, startsAt: '2026-11-18T23:30:00-03:00' },
    actor: 'patient',
    ref: REF,
  });
  assert.match(n.body, /qua, 18\/11 às 23:30/);
});

test('remarcado: mostra de/para e guarda o horário antigo', () => {
  const n = buildRescheduledNotification({
    appointment: { ...appt, startsAt: NEW_STARTS },
    previousStartsAt: STARTS,
    actor: 'patient',
    ref: REF,
  });
  assert.equal(n.type, 'appointment_rescheduled');
  assert.equal(n.title, 'Marina Souza remarcou');
  assert.equal(n.body, 'De qua, 18/11 às 14:00 para qui, 19/11 às 10:30 · Corte.');
  assert.equal(n.data.previous_starts_at, STARTS);
  assert.equal(n.data.starts_at, NEW_STARTS);
  assert.equal(n.dedupeKey, `rescheduled:a1:${NEW_STARTS}`);
  assert.equal(n.alreadyRead, false);
});

test('remarcado pelo Assistente avisa que o cliente não foi notificado', () => {
  const n = buildRescheduledNotification({
    appointment: { ...appt, startsAt: NEW_STARTS },
    previousStartsAt: STARTS,
    actor: 'assistant',
    ref: REF,
  });
  assert.equal(n.alreadyRead, true);
  assert.match(n.body, /O cliente não foi avisado\.$/);
});

test('agendou pelo WhatsApp, pediu aprovação e confirmou', () => {
  const booked = buildBookedNotification({ appointment: appt, ref: REF });
  assert.equal(booked.type, 'appointment_booked');
  assert.equal(booked.title, 'Marina Souza agendou pelo WhatsApp');
  assert.equal(booked.body, 'qua, 18/11 às 14:00 · Corte');

  const pending = buildPendingApprovalNotification({ appointment: appt, ref: REF });
  assert.equal(pending.type, 'appointment_pending_approval');
  assert.match(pending.body, /Aprove ou recuse na agenda\.$/);
  assert.equal(pending.dedupeKey, 'pending:a1');

  const confirmed = buildConfirmedNotification({ appointment: appt, ref: REF });
  assert.equal(confirmed.title, 'Marina Souza confirmou presença');
  assert.equal(confirmed.dedupeKey, 'confirmed:a1');
});

test('conflito com o Google Agenda cita o evento e o atendimento', () => {
  const n = buildConflictNotification({
    appointment: appt,
    googleEventId: 'g1',
    googleSummary: 'Dentista',
    ref: REF,
  });
  assert.equal(n.type, 'appointment_conflict');
  assert.equal(
    n.body,
    '"Dentista" no Google Agenda bate com o atendimento de Marina Souza (qua, 18/11 às 14:00).',
  );
  assert.equal(n.dedupeKey, 'conflict:a1:g1');
});

test('conversa que pede atenção: texto por motivo e citação da mensagem', () => {
  const now = new Date('2026-11-14T12:10:00Z');
  const human = buildConversationAttentionNotification({
    reason: 'handoff',
    patientName: 'Diego',
    patientPhone: '5511911112222',
    lastMessage: 'Quero falar com a doutora',
    now,
  });
  assert.equal(human.title, 'Diego precisa de você');
  assert.match(human.body, /“Quero falar com a doutora”$/);
  assert.deepEqual(human.data, { patient_phone: '5511911112222', actor: 'patient' });

  const fallback = buildConversationAttentionNotification({
    reason: 'fallback',
    patientPhone: '5511911112222',
    now,
  });
  assert.equal(fallback.title, 'A secretária não entendeu Um cliente');
  const paused = buildConversationAttentionNotification({
    reason: 'paused',
    patientName: 'Diego',
    patientPhone: '5511911112222',
    now,
  });
  assert.match(paused.title, /a IA está pausada/);
  const approval = buildConversationAttentionNotification({
    reason: 'approval_needed',
    patientName: 'Diego',
    patientPhone: '5511911112222',
    now,
  });
  assert.match(approval.title, /espera a sua resposta/);
});

test('dedupe de conversa: mesma hora = mesma chave; hora seguinte = outra', () => {
  const a = dedupeKeys.attention('5511911112222', new Date('2026-11-14T12:10:00Z'));
  const b = dedupeKeys.attention('5511911112222', new Date('2026-11-14T12:50:00Z'));
  const c = dedupeKeys.attention('5511911112222', new Date('2026-11-14T13:05:00Z'));
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a, 'attention:5511911112222:2026-11-14-09');
});

test('dedupe de resposta não enviada: janela de 30 minutos', () => {
  const a = dedupeKeys.replyFailed('55119', new Date('2026-11-14T12:01:00Z'));
  const b = dedupeKeys.replyFailed('55119', new Date('2026-11-14T12:20:00Z'));
  const c = dedupeKeys.replyFailed('55119', new Date('2026-11-14T12:31:00Z'));
  assert.equal(a, b);
  assert.notEqual(b, c);
});

test('WhatsApp desconectado e falhas de envio', () => {
  const wa = buildWhatsappDisconnectedNotification(new Date('2026-11-14T12:10:00Z'));
  assert.equal(wa.type, 'whatsapp_disconnected');
  assert.equal(wa.title, 'WhatsApp desconectado');
  assert.equal(wa.dedupeKey, 'wa-disconnected:2026-11-14-09');

  const rem = buildReminderFailedNotification({
    reminderId: 'r1',
    appointment: appt,
    reminderType: '2h',
    reason: 'WhatsApp desconectado',
    ref: REF,
  });
  assert.equal(rem.type, 'message_failed');
  assert.equal(rem.title, 'Lembrete não enviado para Marina Souza');
  assert.equal(
    rem.body,
    'Lembrete de 2h do atendimento de qua, 18/11 às 14:00: WhatsApp desconectado.',
  );
  assert.equal(rem.dedupeKey, 'reminder-failed:r1');

  const reply = buildReplyFailedNotification({
    patientName: 'Marina',
    patientPhone: '5511999998888',
    reason: 'timeout',
    now: REF,
  });
  assert.equal(reply.title, 'Resposta não enviada para Marina');
  assert.equal(reply.body, 'A mensagem da secretária não foi entregue: timeout. Confira o WhatsApp.');
  assert.equal(reply.data.patient_phone, '5511999998888');
});

test('título cabe no limite do banco mesmo com nome enorme', () => {
  const n = buildCancelledNotification({
    appointment: { ...appt, patientName: 'x'.repeat(500) },
    actor: 'patient',
    ref: REF,
  });
  assert.ok(n.title.length <= 200);
  assert.ok(n.body.length <= 1000);
});
