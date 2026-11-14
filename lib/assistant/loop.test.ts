// Rodar: npm test  (node:test via tsx)
// Testa o loop de tool use com um "modelo" falso (sem rede, sem banco).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type Anthropic from '@anthropic-ai/sdk';
import { FALLBACK_REPLY, MAX_ITERATIONS, runToolLoop, type CreateMessage } from './loop';
import type { ToolOutcome } from './executor';
import { ASSISTANT_TOOLS } from './tools';

const UUID = '3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const usage = { input_tokens: 1, output_tokens: 1 } as Anthropic.Usage;

function msg(
  content: Anthropic.ContentBlock[],
  stop_reason: Anthropic.Message['stop_reason'],
): Anthropic.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'fake',
    content,
    stop_reason,
    stop_sequence: null,
    usage,
  } as Anthropic.Message;
}

const text = (t: string): Anthropic.ContentBlock => ({ type: 'text', text: t, citations: null }) as Anthropic.ContentBlock;
const toolUse = (id: string, name: string, input: unknown): Anthropic.ContentBlock =>
  ({ type: 'tool_use', id, name, input }) as Anthropic.ContentBlock;

/** Devolve as respostas na ordem e guarda cada chamada recebida. */
function fakeModel(responses: Anthropic.Message[]) {
  const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const create: CreateMessage = async (params) => {
    // Copia: o loop reutiliza o mesmo array de mensagens.
    calls.push({ ...params, messages: [...params.messages] });
    const next = responses.shift();
    if (!next) throw new Error('modelo falso sem mais respostas');
    return next;
  };
  return { create, calls };
}

const base = {
  model: 'fake',
  system: [{ type: 'text', text: 'sys' }] as Anthropic.TextBlockParam[],
  tools: ASSISTANT_TOOLS,
  messages: [{ role: 'user', content: 'oi' }] as Anthropic.MessageParam[],
};

test('resposta em texto direto não executa ferramenta', async () => {
  const { create, calls } = fakeModel([msg([text('Olá!')], 'end_turn')]);
  let executed = 0;
  const r = await runToolLoop({
    ...base,
    create,
    execute: async () => {
      executed++;
      return { ok: true, data: {} };
    },
  });
  assert.equal(r.reply, 'Olá!');
  assert.equal(r.iterations, 1);
  assert.equal(executed, 0);
  assert.equal(calls.length, 1);
  assert.equal(r.exhausted, false);
});

test('tool_use → tool_result → texto, devolvendo o resultado no turno do usuário', async () => {
  const { create, calls } = fakeModel([
    msg([text('Vou criar.'), toolUse('tu_1', 'create_reminder', { text: 'Ligar', date: '2026-11-18', time: '09:00' })], 'tool_use'),
    msg([text('Pronto, lembrete criado.')], 'end_turn'),
  ]);
  const seen: unknown[] = [];
  const r = await runToolLoop({
    ...base,
    create,
    execute: async (name, input): Promise<ToolOutcome> => {
      seen.push({ name, input });
      return { ok: true, data: { id: UUID }, action: 'Lembrete criado: qua, 18/11 às 09:00' };
    },
  });
  assert.equal(r.reply, 'Pronto, lembrete criado.');
  assert.deepEqual(r.actions, ['Lembrete criado: qua, 18/11 às 09:00']);
  assert.equal(r.iterations, 2);
  assert.equal(seen.length, 1);
  assert.equal((seen[0] as { name: string }).name, 'create_reminder');

  // Segunda chamada: [user, assistant(tool_use), user(tool_result)].
  const second = calls[1].messages;
  assert.equal(second.length, 3);
  assert.equal(second[1].role, 'assistant');
  const results = second[2].content as Anthropic.ToolResultBlockParam[];
  assert.equal(second[2].role, 'user');
  assert.equal(results[0].type, 'tool_result');
  assert.equal(results[0].tool_use_id, 'tu_1');
  assert.ok(!results[0].is_error);
});

test('vários tool_use no mesmo turno viram UM turno de usuário com todos os resultados', async () => {
  const { create, calls } = fakeModel([
    msg(
      [
        toolUse('a', 'list_agenda', { date_from: '2026-11-18' }),
        toolUse('b', 'list_reminders', {}),
      ],
      'tool_use',
    ),
    msg([text('Aqui está.')], 'end_turn'),
  ]);
  const r = await runToolLoop({
    ...base,
    create,
    execute: async () => ({ ok: true, data: { items: [] } }),
  });
  assert.equal(r.reply, 'Aqui está.');
  const last = calls[1].messages.at(-1)!;
  const results = last.content as Anthropic.ToolResultBlockParam[];
  assert.deepEqual(
    results.map((x) => x.tool_use_id),
    ['a', 'b'],
  );
});

test('input inválido vira tool_result com is_error e NÃO executa a ferramenta', async () => {
  const { create, calls } = fakeModel([
    msg([toolUse('x', 'create_reminder', { text: '', date: '2026-02-30', time: '99:99' })], 'tool_use'),
    msg([text('Preciso de outra data.')], 'end_turn'),
  ]);
  let executed = 0;
  const r = await runToolLoop({
    ...base,
    create,
    execute: async () => {
      executed++;
      return { ok: true, data: {} };
    },
  });
  assert.equal(executed, 0);
  assert.equal(r.reply, 'Preciso de outra data.');
  const results = calls[1].messages.at(-1)!.content as Anthropic.ToolResultBlockParam[];
  assert.equal(results[0].is_error, true);
  assert.match(String(results[0].content), /inválid/);
});

test('ferramenta desconhecida também volta como erro', async () => {
  const { create, calls } = fakeModel([
    msg([toolUse('x', 'format_disk', {})], 'tool_use'),
    msg([text('Não faço isso.')], 'end_turn'),
  ]);
  let executed = 0;
  await runToolLoop({
    ...base,
    create,
    execute: async () => {
      executed++;
      return { ok: true, data: {} };
    },
  });
  assert.equal(executed, 0);
  const results = calls[1].messages.at(-1)!.content as Anthropic.ToolResultBlockParam[];
  assert.equal(results[0].is_error, true);
});

test('erro de negócio do executor chega ao modelo como is_error e não vira ação', async () => {
  const { create, calls } = fakeModel([
    msg([toolUse('x', 'cancel_reminder', { reminder_id: UUID })], 'tool_use'),
    msg([text('Não achei esse lembrete.')], 'end_turn'),
  ]);
  const r = await runToolLoop({
    ...base,
    create,
    execute: async () => ({ ok: false, error: 'Lembrete não encontrado' }),
  });
  assert.deepEqual(r.actions, []);
  const results = calls[1].messages.at(-1)!.content as Anthropic.ToolResultBlockParam[];
  assert.equal(results[0].is_error, true);
  assert.equal(results[0].content, 'Lembrete não encontrado');
});

test('limite de iterações: para, devolve a resposta padrão e marca exhausted', async () => {
  const responses = Array.from({ length: 20 }, (_, i) =>
    msg([toolUse(`t${i}`, 'list_reminders', {})], 'tool_use'),
  );
  const { create, calls } = fakeModel(responses);
  const r = await runToolLoop({
    ...base,
    create,
    maxIterations: 3,
    execute: async () => ({ ok: true, data: {} }),
  });
  assert.equal(calls.length, 3);
  assert.equal(r.exhausted, true);
  assert.equal(r.reply, FALLBACK_REPLY);
  assert.ok(MAX_ITERATIONS >= 3);
});

test('texto vazio: "Pronto." se houve ação, senão resposta padrão', async () => {
  const withAction = fakeModel([
    msg([toolUse('x', 'set_day_off', { date: '2026-11-20' })], 'tool_use'),
    msg([], 'end_turn'),
  ]);
  const a = await runToolLoop({
    ...base,
    create: withAction.create,
    execute: async () => ({ ok: true, data: {}, action: 'Folga marcada' }),
  });
  assert.equal(a.reply, 'Pronto.');

  const without = fakeModel([msg([], 'end_turn')]);
  const b = await runToolLoop({
    ...base,
    create: without.create,
    execute: async () => ({ ok: true, data: {} }),
  });
  assert.equal(b.reply, FALLBACK_REPLY);
});
