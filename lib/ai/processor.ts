import Anthropic from '@anthropic-ai/sdk';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildSystemPrompt } from './prompt-builder';
import { executeAction } from './executor';
import { createServerClient } from '@/lib/supabase';
import { getAvailableSlots } from '@/lib/availability/slots';
import type {
  AIResponse,
  ConversationRole,
  Professional,
} from '@/types/database';

type Supabase = ReturnType<typeof createServerClient>;

/**
 * Monta um resumo do paciente (se já cadastrado) para dar contexto à IA:
 * nome, consultas realizadas, faltas, próxima consulta marcada e notas.
 * Retorna null quando o número é desconhecido (a IA trata como novo).
 */
async function buildPatientContext(
  supabase: Supabase,
  professionalId: string,
  phone: string,
): Promise<string | null> {
  const [{ data: patient }, { data: appts }] = await Promise.all([
    supabase
      .from('patients')
      .select('name, notes')
      .eq('professional_id', professionalId)
      .eq('phone', phone)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('starts_at, status')
      .eq('professional_id', professionalId)
      .eq('patient_phone', phone)
      .order('starts_at', { ascending: true }),
  ]);

  const rows = appts ?? [];
  if (!patient && rows.length === 0) return null;

  const now = Date.now();
  const past = rows.filter(
    (a) => new Date(a.starts_at).getTime() < now && a.status !== 'cancelled',
  );
  const attended = past.filter((a) => a.status !== 'no_show');
  const noShows = past.filter((a) => a.status === 'no_show');
  const upcoming = rows.find(
    (a) =>
      new Date(a.starts_at).getTime() >= now &&
      ['scheduled', 'confirmed', 'pending_approval'].includes(a.status),
  );

  const d = (iso: string) =>
    format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
  const dt = (iso: string) =>
    format(new Date(iso), "dd/MM 'às' HH:mm", { locale: ptBR });

  const lines = ['CONTEXTO DO PACIENTE (já cadastrado — personalize o atendimento):'];
  if (patient?.name) lines.push(`- Nome: ${patient.name}`);
  if (attended.length) {
    lines.push(
      `- Consultas realizadas: ${attended.length} (última em ${d(attended[attended.length - 1].starts_at)})`,
    );
  }
  if (noShows.length) lines.push(`- Faltas (não compareceu): ${noShows.length}`);
  if (upcoming) {
    lines.push(
      `- Já tem consulta marcada: ${dt(upcoming.starts_at)}. NÃO marque outra sem confirmar com o paciente; ofereça remarcar/cancelar se for o caso.`,
    );
  }
  if (patient?.notes) lines.push(`- Notas do consultório: ${patient.notes}`);

  return lines.length > 1 ? lines.join('\n') : null;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modelo configurável por env. Default Sonnet 4.6 (atual, confiável em JSON).
// Haiku é mais barato porém menos confiável nesse formato — ver o fallback abaixo.
const AI_MODEL = process.env.AI_MODEL ?? 'claude-sonnet-4-6';

const FALLBACK_REPLY: AIResponse = {
  action: 'reply',
  message_to_patient: 'Desculpe, não entendi. Pode reformular?',
};

/**
 * Extrai o AIResponse do texto do modelo de forma tolerante: remove cercas de
 * markdown (```json ... ```) e, se ainda falhar, pega do primeiro `{` ao último
 * `}`. Retorna null se não der pra montar um AIResponse válido.
 */
function parseAIResponse(raw: string): AIResponse | null {
  if (!raw) return null;
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  let obj = tryParse(text);
  if (!obj) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) obj = tryParse(text.slice(start, end + 1));
  }

  if (
    !obj ||
    typeof obj !== 'object' ||
    typeof (obj as AIResponse).action !== 'string' ||
    typeof (obj as AIResponse).message_to_patient !== 'string'
  ) {
    return null;
  }
  return obj as AIResponse;
}

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

  const [slots, patientContext] = await Promise.all([
    getAvailableSlots(professional.id, 14),
    buildPatientContext(supabase, professional.id, patientPhone),
  ]);
  const systemPrompt = buildSystemPrompt(professional, slots, patientContext);

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
    const parsed = parseAIResponse(rawText);
    const text = rawText.trim();
    // Se o modelo respondeu em prosa (sem JSON), usa o próprio texto como
    // resposta — melhor que "não entendi". Só cai no fallback genérico se vier
    // vazio ou um JSON quebrado (que não dá pra mostrar ao paciente).
    const looksLikeJson = /[{}]|"action"|```/.test(text);
    if (parsed) {
      aiResponse = parsed;
    } else if (text && !looksLikeJson) {
      console.warn('IA respondeu sem JSON; usando o texto como reply.');
      aiResponse = { action: 'reply', message_to_patient: text };
    } else {
      console.error('Resposta da IA inválida. Cru:', rawText.slice(0, 500));
      aiResponse = FALLBACK_REPLY;
    }
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
