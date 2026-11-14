// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildPersonalReminderMessage,
  checkPersonalReminderDelivery,
  type DeliveryProfile,
} from './reminders';

const READY: DeliveryProfile = {
  phone: '(11) 91111-2222',
  plan_status: 'active',
  zapi_instance_id: 'iazen_abc',
  whatsapp_connected: true,
};

test('buildPersonalReminderMessage identifica o assistente e apara o texto', () => {
  assert.equal(
    buildPersonalReminderMessage('  Ligar para o contador \n'),
    'Lembrete do seu assistente IAzen:\nLigar para o contador',
  );
});

test('entrega ok normaliza o telefone para 55DDD...', () => {
  const r = checkPersonalReminderDelivery(READY);
  assert.deepEqual(r, { ok: true, phone: '5511911112222' });
});

test('trialing também entrega', () => {
  assert.equal(checkPersonalReminderDelivery({ ...READY, plan_status: 'trialing' }).ok, true);
});

test('plano inativo bloqueia, com o status no motivo', () => {
  const r = checkPersonalReminderDelivery({ ...READY, plan_status: 'past_due' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /past_due/);
});

test('WhatsApp desconectado ou sem instância bloqueia', () => {
  const a = checkPersonalReminderDelivery({ ...READY, whatsapp_connected: false });
  const b = checkPersonalReminderDelivery({ ...READY, zapi_instance_id: null });
  for (const r of [a, b]) {
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /WhatsApp/);
  }
});

test('telefone ausente ou inválido bloqueia', () => {
  for (const phone of [null, '', '123']) {
    const r = checkPersonalReminderDelivery({ ...READY, phone });
    assert.equal(r.ok, false, String(phone));
    if (!r.ok) assert.match(r.reason, /Telefone/);
  }
});

test('o plano é checado antes do WhatsApp (motivo mais útil primeiro)', () => {
  const r = checkPersonalReminderDelivery({
    ...READY,
    plan_status: 'cancelled',
    whatsapp_connected: false,
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /Plano/);
});
