// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ASSISTANT_TOOLS,
  MAX_AGENDA_DAYS,
  TOOL_NAMES,
  parseToolInput,
} from './tools';

const UUID = '3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

test('toda ferramenta tem definição para a API com input_schema de objeto', () => {
  assert.equal(ASSISTANT_TOOLS.length, TOOL_NAMES.length);
  for (const tool of ASSISTANT_TOOLS) {
    assert.ok(tool.description && tool.description.length > 20, tool.name);
    assert.equal(tool.input_schema.type, 'object', tool.name);
    assert.ok(!('$schema' in tool.input_schema), tool.name);
  }
  assert.deepEqual(
    [...TOOL_NAMES].sort(),
    [
      'cancel_reminder',
      'confirm_pending_action',
      'create_appointment',
      'create_personal_event',
      'create_reminder',
      'list_agenda',
      'list_free_slots',
      'list_reminders',
      'prepare_cancel_appointment',
      'prepare_reschedule_appointment',
      'set_day_off',
    ],
  );
});

test('nenhuma ferramenta cancela/remarca direto: só preparar + confirmar', () => {
  assert.ok(!TOOL_NAMES.includes('cancel_appointment' as never));
  assert.ok(!TOOL_NAMES.includes('reschedule_appointment' as never));
  for (const name of ['prepare_cancel_appointment', 'prepare_reschedule_appointment']) {
    const tool = ASSISTANT_TOOLS.find((t) => t.name === name)!;
    const props = (tool.input_schema as { properties?: Record<string, unknown> }).properties;
    // O modelo não escolhe se está confirmado: a confirmação é outra ferramenta.
    assert.ok(!props || !('confirmed' in props), name);
  }
});

test('ferramenta desconhecida é recusada', () => {
  const r = parseToolInput('drop_database', {});
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /desconhecida/);
});

test('list_agenda: válido, intervalo omitido e limites', () => {
  assert.equal(parseToolInput('list_agenda', { date_from: '2026-11-18' }).ok, true);
  assert.equal(
    parseToolInput('list_agenda', { date_from: '2026-11-18', date_to: '2026-11-20' }).ok,
    true,
  );
  assert.equal(
    parseToolInput('list_agenda', { date_from: '2026-11-20', date_to: '2026-11-18' }).ok,
    false,
  );
  assert.equal(
    parseToolInput('list_agenda', { date_from: '2026-02-30' }).ok,
    false,
  );
  // Janela maior que o máximo.
  assert.equal(
    parseToolInput('list_agenda', { date_from: '2026-01-01', date_to: '2026-04-01' }).ok,
    false,
  );
  assert.ok(MAX_AGENDA_DAYS >= 7);
});

test('create_appointment: aceita o mínimo e normaliza espaços', () => {
  const r = parseToolInput('create_appointment', {
    client_name: '  Maria Souza  ',
    date: '2026-11-18',
    time: '14:00',
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal((r.input as { client_name: string }).client_name, 'Maria Souza');
});

test('create_appointment: recusa hora, duração e nome inválidos', () => {
  const base = { client_name: 'Maria', date: '2026-11-18', time: '14:00' };
  assert.equal(parseToolInput('create_appointment', { ...base, time: '2pm' }).ok, false);
  assert.equal(parseToolInput('create_appointment', { ...base, duration_min: 0 }).ok, false);
  assert.equal(parseToolInput('create_appointment', { ...base, duration_min: 90.5 }).ok, false);
  assert.equal(parseToolInput('create_appointment', { ...base, client_name: '   ' }).ok, false);
  assert.equal(parseToolInput('create_appointment', { ...base, service_id: 'abc' }).ok, false);
  assert.equal(parseToolInput('create_appointment', { ...base, service_id: UUID }).ok, true);
});

test('prepare_cancel_appointment: exige id uuid; motivo é opcional e limitado', () => {
  assert.equal(parseToolInput('prepare_cancel_appointment', { appointment_id: UUID }).ok, true);
  assert.equal(
    parseToolInput('prepare_cancel_appointment', { appointment_id: UUID, reason: 'Viagem' }).ok,
    true,
  );
  assert.equal(
    parseToolInput('prepare_cancel_appointment', { appointment_id: UUID, reason: 'x'.repeat(501) }).ok,
    false,
  );
  assert.equal(parseToolInput('prepare_cancel_appointment', { appointment_id: 'nao-uuid' }).ok, false);
  // Um "confirmed" enviado pelo modelo não tem efeito: o campo nem existe no schema.
  const r = parseToolInput('prepare_cancel_appointment', { appointment_id: UUID, confirmed: true });
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(!('confirmed' in (r.input as object)));
});

test('prepare_reschedule_appointment: exige data e hora válidas', () => {
  assert.equal(
    parseToolInput('prepare_reschedule_appointment', {
      appointment_id: UUID,
      date: '2026-11-19',
      time: '10:30',
    }).ok,
    true,
  );
  assert.equal(
    parseToolInput('prepare_reschedule_appointment', { appointment_id: UUID, date: '2026-11-19' }).ok,
    false,
  );
  assert.equal(
    parseToolInput('prepare_reschedule_appointment', {
      appointment_id: UUID,
      date: '2026-11-19',
      time: '25:00',
    }).ok,
    false,
  );
});

test('confirm_pending_action: não recebe parâmetros (confirma o que foi preparado)', () => {
  assert.equal(parseToolInput('confirm_pending_action', {}).ok, true);
  assert.equal(parseToolInput('confirm_pending_action', undefined).ok, true);
});

test('create_reminder: texto obrigatório e limitado a 500 caracteres', () => {
  const base = { date: '2026-11-18', time: '09:00' };
  assert.equal(parseToolInput('create_reminder', { ...base, text: 'Ligar para o contador' }).ok, true);
  assert.equal(parseToolInput('create_reminder', { ...base, text: '' }).ok, false);
  assert.equal(parseToolInput('create_reminder', { ...base, text: 'x'.repeat(501) }).ok, false);
});

test('list_reminders: status só aceita os valores da tabela', () => {
  assert.equal(parseToolInput('list_reminders', {}).ok, true);
  assert.equal(parseToolInput('list_reminders', undefined).ok, true);
  assert.equal(parseToolInput('list_reminders', { status: 'sent' }).ok, true);
  assert.equal(parseToolInput('list_reminders', { status: 'done' }).ok, false);
});

test('mensagem de erro de validação cita o campo problemático', () => {
  const r = parseToolInput('create_personal_event', {
    title: 'Dentista',
    date: '2026-11-18',
    time: '99:99',
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /time/);
});
