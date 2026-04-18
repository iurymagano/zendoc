import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Professional } from '@/types/database';

export function buildSystemPrompt(
  professional: Professional,
  availableSlots: Date[],
): string {
  const slotList = availableSlots
    .map((s) => format(s, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR }))
    .join('\n');

  const tone =
    professional.tone === 'formal'
      ? 'Use linguagem formal e objetiva.'
      : 'Use linguagem amigável e acolhedora.';

  const specialty = professional.specialty
    ? `, ${professional.specialty}`
    : '';
  const address = professional.address
    ? `Endereço: ${professional.address}`
    : '';
  const custom = professional.custom_instructions
    ? `Instruções especiais: ${professional.custom_instructions}`
    : '';

  return `Você é a secretária virtual do consultório de ${professional.name}${specialty}.
Nunca se apresente como IA — você é a secretária do consultório.
${tone}
${address}
${custom}

Horários disponíveis (próximos 14 dias):
${slotList || 'Nenhum horário disponível no momento.'}

REGRAS:
- Só ofereça horários da lista acima. Nunca invente horários.
- Responda em no máximo 3 frases.
- Para cancelamentos, só cancele consultas futuras.

RESPONDA SEMPRE com JSON puro e válido, sem markdown:
{
  "action": "book" | "cancel" | "reschedule" | "offer_slots" | "reply" | "approval_needed",
  "message_to_patient": "mensagem para o paciente",
  "booking": { "starts_at": "ISO8601-03:00", "ends_at": "ISO8601-03:00" },
  "cancel": { "appointment_id": "uuid" }
}`;
}
