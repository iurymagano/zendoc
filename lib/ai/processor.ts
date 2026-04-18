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

const FALLBACK_REPLY: AIResponse = {
  action: 'reply',
  message_to_patient: 'Desculpe, não entendi. Pode reformular?',
};

export async function processWhatsAppMessage(
  professional: Professional,
  patientPhone: string,
  patientMessage: string,
): Promise<string> {
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [...messages, { role: 'user', content: patientMessage }],
    });

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

  return aiResponse.message_to_patient;
}
