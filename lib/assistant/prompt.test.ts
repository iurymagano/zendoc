// Rodar: npm test  (node:test via tsx)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildContextPrompt, buildStablePrompt } from './prompt';

const PROF = {
  name: 'Ana Lima',
  specialty: 'Personal trainer',
  tone: 'amigável' as const,
  address: 'Rua das Flores, 10',
};

test('prompt estável não presume área da saúde', () => {
  const p = buildStablePrompt(PROF, []);
  assert.match(p, /assistente pessoal de Ana Lima, Personal trainer/);
  assert.doesNotMatch(p, /consult[óo]rio|pacientes?\b/i);
});

test('prompt estável inclui as regras de confirmação e o aviso de cliente não notificado', () => {
  const p = buildStablePrompt(PROF, []);
  assert.match(p, /prepare_cancel_appointment/);
  assert.match(p, /prepare_reschedule_appointment/);
  assert.match(p, /confirm_pending_action/);
  assert.match(p, /PRÓXIMA mensagem/);
  assert.doesNotMatch(p, /confirmed=true/);
  assert.match(p, /NÃO é avisado automaticamente/);
});

test('serviços entram com id, duração e preço', () => {
  const p = buildStablePrompt(PROF, [
    { id: 'svc-1', name: 'Aula avulsa', duration_min: 60, price_cents: 15000 },
    { id: 'svc-2', name: 'Avaliação', duration_min: 30, price_cents: null },
  ]);
  assert.match(p, /Aula avulsa \(service_id=svc-1\) — 60 min — R\$ 150,00/);
  assert.match(p, /Avaliação \(service_id=svc-2\) — 30 min — valor a combinar/);
});

test('sem serviços e sem especialidade o prompt continua coerente', () => {
  const p = buildStablePrompt({ ...PROF, specialty: null, address: null }, []);
  assert.match(p, /Nenhum serviço cadastrado/);
  assert.doesNotMatch(p, /Área:/);
  assert.doesNotMatch(p, /Endereço:/);
});

test('tom formal é refletido', () => {
  assert.match(buildStablePrompt({ ...PROF, tone: 'formal' }, []), /Tom formal/);
});

test('contexto dinâmico traz agora e a tabela de datas (fora do bloco cacheável)', () => {
  const now = new Date('2026-11-14T19:57:00Z');
  const ctx = buildContextPrompt(now);
  assert.match(ctx, /sábado, 14\/11\/2026, 16:57/);
  assert.match(ctx, /domingo \(amanhã\): 2026-11-15/);
  // O bloco estável não pode conter a hora (senão o cache nunca acerta).
  assert.doesNotMatch(buildStablePrompt(PROF, []), /2026/);
});

test('contexto dinâmico sem ação pendente não menciona confirmação', () => {
  const ctx = buildContextPrompt(new Date('2026-11-14T19:57:00Z'));
  assert.doesNotMatch(ctx, /AÇÃO PREPARADA/);
  assert.equal(ctx, buildContextPrompt(new Date('2026-11-14T19:57:00Z'), null));
});

test('ação pendente vai no bloco dinâmico (nunca no estável) e manda confirmar sem preparar de novo', () => {
  const now = new Date('2026-11-14T19:57:00Z');
  const ctx = buildContextPrompt(now, {
    kind: 'reschedule',
    summary: 'Remarcar Ana: qua, 18/11 às 10:00 → qui, 19/11 às 11:00',
    expires_at: '2026-11-14T20:12:00.000Z',
  });
  assert.match(ctx, /AÇÃO PREPARADA AGUARDANDO CONFIRMAÇÃO \(REMARCAR\)/);
  assert.match(ctx, /Remarcar Ana: qua, 18\/11 às 10:00 → qui, 19\/11 às 11:00 \(vale até 17:12\)/);
  assert.match(ctx, /chame confirm_pending_action/);
  assert.match(ctx, /NÃO chame prepare_cancel_appointment nem prepare_reschedule_appointment de novo/);
  // o bloco cacheável não pode carregar dado volátil
  assert.doesNotMatch(buildStablePrompt(PROF, []), /vale até|Remarcar Ana: qua/);
});

test('regra estável orienta ir direto ao confirm quando há ação preparada no contexto', () => {
  assert.match(
    buildStablePrompt(PROF, []),
    /AÇÃO PREPARADA AGUARDANDO CONFIRMAÇÃO e ela disser sim, vá direto para confirm_pending_action/,
  );
});
