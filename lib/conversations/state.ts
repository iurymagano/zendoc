import { createServerClient } from '@/lib/supabase';

type Supabase = ReturnType<typeof createServerClient>;

/**
 * Indica se a IA está pausada para um contato (handoff manual). Quando pausada,
 * o webhook do WhatsApp guarda a mensagem recebida mas NÃO deixa a IA responder
 * — o profissional assume a conversa.
 */
export async function isConversationPaused(
  supabase: Supabase,
  professionalId: string,
  patientPhone: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('conversation_state')
    .select('ai_paused')
    .eq('professional_id', professionalId)
    .eq('patient_phone', patientPhone)
    .maybeSingle();
  return data?.ai_paused ?? false;
}

/** Define o estado de pausa da IA para um contato (upsert). */
export async function setConversationPaused(
  supabase: Supabase,
  professionalId: string,
  patientPhone: string,
  paused: boolean,
): Promise<void> {
  await supabase.from('conversation_state').upsert(
    {
      professional_id: professionalId,
      patient_phone: patientPhone,
      ai_paused: paused,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'professional_id,patient_phone' },
  );
}
