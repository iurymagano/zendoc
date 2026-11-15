import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notificationHref } from './links';

test('atendimento: abre a agenda no dia (fuso de SP) com o id da notificação', () => {
  assert.equal(
    notificationHref({
      id: 'n1',
      type: 'appointment_cancelled',
      data: { starts_at: '2026-11-18T14:00:00-03:00' },
    }),
    '/agenda?date=2026-11-18&n=n1',
  );
});

test('o dia vem do fuso de São Paulo, não do UTC', () => {
  // 23:30 em SP = 02:30Z do dia seguinte.
  assert.equal(
    notificationHref({
      id: 'n2',
      type: 'appointment_booked',
      data: { starts_at: '2026-11-19T02:30:00Z' },
    }),
    '/agenda?date=2026-11-18&n=n2',
  );
});

test('conversa: abre /conversas com o telefone codificado', () => {
  assert.equal(
    notificationHref({
      id: 'n3',
      type: 'conversation_attention',
      data: { patient_phone: '5511911112222' },
    }),
    '/conversas?phone=5511911112222&n=n3',
  );
  assert.equal(
    notificationHref({ id: 'n3', type: 'conversation_attention', data: {} }),
    '/conversas',
  );
});

test('WhatsApp desconectado leva às configurações do WhatsApp', () => {
  assert.equal(
    notificationHref({ id: 'n4', type: 'whatsapp_disconnected', data: {} }),
    '/configuracoes/whatsapp',
  );
});

test('falha de lembrete vai para a agenda; falha de resposta, para a conversa', () => {
  assert.equal(
    notificationHref({
      id: 'n5',
      type: 'message_failed',
      data: { starts_at: '2026-11-18T14:00:00-03:00', appointment_id: 'a1' },
    }),
    '/agenda?date=2026-11-18&n=n5',
  );
  assert.equal(
    notificationHref({
      id: 'n6',
      type: 'message_failed',
      data: { patient_phone: '5511999998888' },
    }),
    '/conversas?phone=5511999998888&n=n6',
  );
});

test('sem dados úteis cai na agenda; data inválida não quebra', () => {
  assert.equal(notificationHref({ id: 'n7', type: 'appointment_cancelled', data: {} }), '/agenda');
  assert.equal(
    notificationHref({ id: 'n8', type: 'appointment_cancelled', data: { starts_at: 'xx' } }),
    '/agenda',
  );
});
