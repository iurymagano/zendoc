// Loop de tool use do Assistente: chama o modelo, executa as ferramentas que ele
// pedir, devolve os resultados e repete até ele responder em texto (ou até o
// limite de iterações). Sem banco e sem SDK em runtime (o client entra por
// parâmetro) para dar para testar com um modelo falso.
import type Anthropic from '@anthropic-ai/sdk';
import type { ToolOutcome } from './executor';
import { parseToolInput, type ToolName } from './tools';

export const MAX_ITERATIONS = 8;

export const FALLBACK_REPLY =
  'Não consegui concluir tudo desta vez. Confira a agenda e me diga o que ainda falta.';

export type CreateMessage = (
  params: Anthropic.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Message>;

export type ToolLoopParams = {
  create: CreateMessage;
  model: string;
  system: Anthropic.TextBlockParam[];
  tools: Anthropic.Tool[];
  messages: Anthropic.MessageParam[];
  /** Executa uma ferramenta JÁ validada. */
  execute: (name: ToolName, input: unknown) => Promise<ToolOutcome>;
  maxIterations?: number;
  maxTokens?: number;
  onUsage?: (usage: Anthropic.Usage) => void;
};

export type ToolLoopResult = {
  reply: string;
  /** Frases das ações que alteraram dados (para a UI). */
  actions: string[];
  iterations: number;
  /** true se o limite de iterações estourou sem resposta final. */
  exhausted: boolean;
};

/** Junta os blocos de texto de uma resposta. */
export function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export async function runToolLoop(p: ToolLoopParams): Promise<ToolLoopResult> {
  const max = p.maxIterations ?? MAX_ITERATIONS;
  const messages = [...p.messages];
  const actions: string[] = [];

  for (let i = 1; i <= max; i++) {
    const response = await p.create({
      model: p.model,
      max_tokens: p.maxTokens ?? 1024,
      system: p.system,
      tools: p.tools,
      messages,
    });
    p.onUsage?.(response.usage);

    if (response.stop_reason !== 'tool_use') {
      const reply = extractText(response.content);
      return {
        reply: reply || (actions.length > 0 ? 'Pronto.' : FALLBACK_REPLY),
        actions,
        iterations: i,
        exhausted: false,
      };
    }

    // O assistente "pensou em voz alta" + pediu ferramentas: devolve o turno
    // inteiro e responde TODOS os tool_use num único turno de usuário.
    messages.push({ role: 'assistant', content: response.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;

      const parsed = parseToolInput(block.name, block.input);
      if (!parsed.ok) {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          is_error: true,
          content: parsed.error,
        });
        continue;
      }

      const outcome = await p.execute(parsed.name, parsed.input);
      if (outcome.ok) {
        if (outcome.action) actions.push(outcome.action);
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(outcome.data),
        });
      } else {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          is_error: true,
          content: outcome.error,
        });
      }
    }
    messages.push({ role: 'user', content: results });
  }

  return { reply: FALLBACK_REPLY, actions, iterations: max, exhausted: true };
}
