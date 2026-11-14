// Orquestra um turno do chat do Assistente pessoal: histórico → prompt →
// loop de tool use → persistência. O profissional vem sempre da sessão.
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';
import type { Professional } from '@/types/database';
import { runTool } from './executor';
import { runToolLoop } from './loop';
import { buildContextPrompt, buildStablePrompt } from './prompt';
import { ASSISTANT_TOOLS } from './tools';

/** Quantas mensagens do histórico a IA enxerga (controla custo). */
export const HISTORY_LIMIT = 20;

export type AssistantTurn = { reply: string; actions: string[] };

type StoredRole = 'user' | 'assistant';

export async function runAssistantChat(
  professional: Professional,
  userMessage: string,
): Promise<AssistantTurn> {
  const supabase = createServerClient();
  const startedAt = new Date();
  // Identifica ESTA mensagem do usuário: confirmar uma ação preparada na mesma
  // requisição é recusado pelo servidor (ver pending.ts).
  const requestId = randomUUID();

  const { data: rows } = await supabase
    .from('assistant_messages')
    .select('role, content')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  const history = ((rows ?? []) as { role: StoredRole; content: string }[])
    .reverse()
    // A API exige que a conversa comece por "user".
    .filter((m, i, arr) => !(i === 0 && m.role === 'assistant' && arr.length > 0));

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_min, price_cents')
    .eq('professional_id', professional.id)
    .eq('active', true)
    .order('name')
    .limit(30);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.AI_MODEL ?? 'claude-sonnet-4-6';

  let reply: string;
  // Coletado aqui (e não só no loop) para sobreviver a uma falha da API no meio.
  const actions: string[] = [];
  try {
    const result = await runToolLoop({
      create: (params) => client.messages.create(params),
      model,
      system: [
        // Prefixo estável (perfil + regras + serviços) cacheado entre as
        // mensagens da conversa; o bloco de data/hora vem depois.
        {
          type: 'text',
          text: buildStablePrompt(professional, services ?? []),
          cache_control: { type: 'ephemeral' },
        },
        { type: 'text', text: buildContextPrompt(startedAt) },
      ],
      tools: ASSISTANT_TOOLS,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage },
      ],
      execute: async (name, input) => {
        const outcome = await runTool(
          { professional, requestId, now: startedAt },
          name,
          input,
        );
        if (outcome.ok && outcome.action) actions.push(outcome.action);
        return outcome;
      },
      onUsage: (u) => {
        if (process.env.AI_DEBUG === '1') {
          console.log(
            `[assistente] tokens in=${u.input_tokens} out=${u.output_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0}`,
          );
        }
      },
    });
    reply = result.reply;
  } catch (err) {
    console.error('assistente: erro no loop de IA:', err);
    // Nada foi alterado: deixa a rota responder 500 (o usuário tenta de novo).
    if (actions.length === 0) throw err;
    // Algo já foi gravado antes da falha: não deixa o usuário no escuro (e,
    // sem histórico, ele repetiria o pedido e duplicaria a ação).
    reply = `Fiz isto antes de ter um problema: ${actions.join('; ')}. Confira a agenda antes de repetir o pedido.`;
  }

  // created_at explícito: duas linhas num único insert compartilham now() e
  // perderiam a ordem.
  const userAt = startedAt;
  const assistantAt = new Date(Math.max(Date.now(), userAt.getTime() + 1));
  const { error } = await supabase.from('assistant_messages').insert([
    {
      professional_id: professional.id,
      role: 'user',
      content: userMessage,
      created_at: userAt.toISOString(),
    },
    {
      professional_id: professional.id,
      role: 'assistant',
      content: reply,
      actions: actions.length > 0 ? actions : null,
      created_at: assistantAt.toISOString(),
    },
  ]);
  if (error) console.error('assistente: erro ao salvar histórico:', error);

  return { reply, actions };
}
