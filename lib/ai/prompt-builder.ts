import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Professional } from '@/types/database';
import type { Slot } from '@/lib/availability/slots';

// O sistema assume horário de Brasília (-03:00) — mesma premissa do resto do app
// (agenda e cálculo de slots). Formata o ISO com esse offset fixo.
function toIso(d: Date): string {
  return `${format(d, "yyyy-MM-dd'T'HH:mm:ss")}-03:00`;
}

export function buildSystemPrompt(
  professional: Professional,
  availableSlots: Slot[],
): string {
  const slotList = availableSlots
    .map((s) => {
      const label = format(s.start, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR,
      });
      return `- ${label} (starts_at=${toIso(s.start)} ends_at=${toIso(s.end)})`;
    })
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

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return `Você é a secretária virtual do consultório de ${professional.name}${specialty}.
Nunca se apresente como IA — você é a secretária do consultório.
${tone}
${address}
${custom}

Hoje é ${hoje}.

Horários disponíveis (próximos 14 dias):
${slotList || 'Nenhum horário disponível no momento.'}

REGRAS:
- Só ofereça horários da lista acima. Nunca invente horários.
- Ao agendar ou remarcar, copie EXATAMENTE os valores starts_at e ends_at do
  horário escolhido (entre parênteses na lista). Nunca construa, calcule ou
  altere a data/hora — use o ISO exato, incluindo o ano e o offset -03:00.
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
