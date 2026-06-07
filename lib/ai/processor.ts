import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './prompt-builder';
import { executeAction } from './executor';
import { createServerClient } from '@/lib/supabase';
import { getAvailableSlots } from '@/lib/availability/slots';
import type {
  AIResponse,
  ConversationRole,
  Professional,
} from '@/types/database';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modelo configurável por env. Produção usa o default (Sonnet); no dev dá pra
// economizar setando AI_MODEL=claude-haiku-4-5 no .env.local.
const AI_MODEL = process.env.AI_MODEL ?? 'claude-sonnet-4-20250514';

const FALLBACK_REPLY: AIResponse = {
  action: 'reply',
  message_to_patient: 'Desculpe, não entendi. Pode reformular?',
};

export async function processWhatsAppMessage(
  professional: Professional,
  patientPhone: string,
  patientMessage: string,
): Promise<AIResponse> {
  const supabase = createServerClient();

  const { data: history } = await supabase
    .from('conversation_history')
    .select('role, content')
    .eq('professional_id', professional.id)
    .eq('patient_phone', patientPhone)
    .order('created_at', { ascending: false })
    .limit(10);

  const messages = (history ?? [])
    .reverse()
    .map((m) => ({
      role: m.role as ConversationRole,
      content: m.content,
    }));

  const slots = await getAvailableSlots(professional.id, 14);
  const systemPrompt = buildSystemPrompt(professional, slots);

  let aiResponse: AIResponse;
  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      // System prompt como bloco com cache_control → a parte estável (perfil,
      // regras, lista de horários) é cacheada e custa ~10% nas mensagens
      // seguintes da mesma conversa (TTL de 5 min). A parte volátil (a mensagem
      // do paciente) fica em `messages`, depois do prefixo cacheado.
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [...messages, { role: 'user', content: patientMessage }],
    });

    if (process.env.AI_DEBUG) {
      const u = response.usage;
      console.log('[ai] tokens', {
        model: AI_MODEL,
        input: u.input_tokens,
        cache_write: u.cache_creation_input_tokens,
        cache_read: u.cache_read_input_tokens,
        output: u.output_tokens,
      });
    }

    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    aiResponse = JSON.parse(rawText);
  } catch (err) {
    console.error('Falha ao processar resposta da IA:', err);
    aiResponse = FALLBACK_REPLY;
  }

  try {
    await executeAction(professional, patientPhone, aiResponse);
  } catch (err) {
    console.error('Falha ao executar ação da IA:', err);
  }

  await supabase.from('conversation_history').insert([
    {
      professional_id: professional.id,
      patient_phone: patientPhone,
      role: 'user',
      content: patientMessage,
    },
    {
      professional_id: professional.id,
      patient_phone: patientPhone,
      role: 'assistant',
      content: aiResponse.message_to_patient,
    },
  ]);

  return aiResponse;
}
