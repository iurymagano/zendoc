// Definição e validação das ferramentas (tool use) do Assistente pessoal.
// PURO: só zod + tipos. O que cada ferramenta faz no banco fica em executor.ts.
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { diffDays, isValidDate, isValidTime } from './datetime';

export const MAX_AGENDA_DAYS = 31;

const dateField = z
  .string()
  .refine(isValidDate, 'data inválida — use YYYY-MM-DD')
  .describe(
    'Data YYYY-MM-DD (fuso de São Paulo). Copie da tabela de datas do contexto; nunca calcule o dia da semana de cabeça.',
  );

const timeField = z
  .string()
  .refine(isValidTime, 'hora inválida — use HH:mm (24h)')
  .describe('Hora HH:mm, formato 24h (ex.: 14:30).');

const uuidField = (what: string) =>
  z.string().uuid('id inválido').describe(`UUID ${what}.`);

const durationField = (min: number, max: number, extra = '') =>
  z
    .number()
    .int()
    .min(min)
    .max(max)
    .optional()
    .describe(`Duração em minutos (${min}-${max}).${extra}`);

export const toolSchemas = {
  list_agenda: z
    .object({
      date_from: dateField,
      date_to: dateField
        .optional()
        .describe('Último dia (inclusive). Omitido = só date_from.'),
    })
    .refine((d) => !d.date_to || diffDays(d.date_from, d.date_to) >= 0, {
      message: 'date_to não pode ser antes de date_from',
      path: ['date_to'],
    })
    .refine(
      (d) => !d.date_to || diffDays(d.date_from, d.date_to) < MAX_AGENDA_DAYS,
      {
        message: `intervalo máximo de ${MAX_AGENDA_DAYS} dias`,
        path: ['date_to'],
      },
    ),

  list_free_slots: z.object({
    date_from: dateField.optional().describe('Primeiro dia (inclusive). Omitido = amanhã.'),
    date_to: dateField.optional().describe('Último dia (inclusive). Omitido = 14 dias à frente.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(40)
      .optional()
      .describe('Máximo de horários a devolver (padrão 20).'),
  }),

  create_appointment: z.object({
    client_name: z.string().trim().min(1).max(120).describe('Nome do cliente.'),
    client_phone: z
      .string()
      .trim()
      .min(8)
      .max(25)
      .optional()
      .describe(
        'Telefone do cliente com DDD (qualquer formato). Obrigatório se o cliente ainda não estiver cadastrado; se já estiver (mesmo nome), pode omitir.',
      ),
    date: dateField,
    time: timeField,
    duration_min: durationField(
      5,
      600,
      ' Omitido = duração do serviço escolhido ou 50 min.',
    ),
    service_id: uuidField('do serviço (da lista de serviços do contexto)').optional(),
    notes: z.string().trim().max(2000).optional().describe('Observações internas.'),
  }),

  create_personal_event: z.object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .describe('O que é o compromisso (ex.: "Dentista", "Reunião de condomínio").'),
    date: dateField,
    time: timeField,
    duration_min: durationField(5, 1440, ' Omitido = 60 min.'),
    notes: z.string().trim().max(2000).optional(),
  }),

  set_day_off: z.object({
    date: dateField,
    note: z.string().trim().max(200).optional().describe('Motivo (opcional).'),
  }),

  prepare_cancel_appointment: z.object({
    appointment_id: uuidField('do atendimento/compromisso (id vindo de list_agenda)'),
    reason: z.string().trim().max(500).optional().describe('Motivo (opcional).'),
  }),

  prepare_reschedule_appointment: z.object({
    appointment_id: uuidField('do atendimento/compromisso (id vindo de list_agenda)'),
    date: dateField.describe('Nova data YYYY-MM-DD.'),
    time: timeField.describe('Nova hora HH:mm (24h).'),
    duration_min: durationField(5, 1440, ' Omitido = mantém a duração atual.'),
  }),

  confirm_pending_action: z.object({}),

  create_reminder: z.object({
    text: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .describe('Texto do lembrete, como a pessoa quer ler (ex.: "Ligar para o contador").'),
    date: dateField,
    time: timeField,
  }),

  list_reminders: z.object({
    status: z
      .enum(['pending', 'sent', 'failed', 'cancelled'])
      .optional()
      .describe('Padrão: pending (os que ainda vão disparar).'),
  }),

  cancel_reminder: z.object({
    reminder_id: uuidField('do lembrete (id vindo de list_reminders)'),
  }),
} as const;

export type ToolName = keyof typeof toolSchemas;
export type ToolInput<N extends ToolName> = z.infer<(typeof toolSchemas)[N]>;

export const TOOL_NAMES = Object.keys(toolSchemas) as ToolName[];

const DESCRIPTIONS: Record<ToolName, string> = {
  list_agenda:
    'Lista os atendimentos e compromissos NÃO cancelados da agenda entre date_from e date_to (inclusive), em ordem, e também as folgas (dia inteiro bloqueado) do período. Use para "o que tenho amanhã?" e para descobrir o id antes de cancelar/remarcar.',
  list_free_slots:
    'Lista horários livres da rotina de atendimento (disponibilidade semanal + exceções, descontando o que já está marcado). Só enxerga de amanhã em diante, até 14 dias. O profissional pode marcar fora desses horários: nesse caso use create_appointment direto.',
  create_appointment:
    'Cria um atendimento com um cliente na agenda. Verifica conflito de horário. Se o cliente não estiver cadastrado, precisa do telefone.',
  create_personal_event:
    'Bloqueia um horário da agenda com um compromisso pessoal (dentista, reunião, almoço…). Não é cliente: ninguém recebe mensagem. Para o dia inteiro use set_day_off.',
  set_day_off:
    'Marca o dia inteiro como folga: nenhum horário será oferecido pela secretária no WhatsApp. NÃO cancela atendimentos já marcados nesse dia (a resposta informa quantos existem).',
  prepare_cancel_appointment:
    'PASSO 1 de 2 para cancelar um atendimento/compromisso: registra o pedido e mostra o que seria cancelado, mas NÃO cancela nada. Depois mostre ao usuário o item e peça confirmação; o cancelamento só acontece com confirm_pending_action, em uma mensagem POSTERIOR do usuário.',
  prepare_reschedule_appointment:
    'PASSO 1 de 2 para remarcar um atendimento/compromisso (já verifica conflito no novo horário): NÃO altera nada. Depois mostre ao usuário o item e o novo horário e peça confirmação; a mudança só acontece com confirm_pending_action, em uma mensagem POSTERIOR do usuário.',
  confirm_pending_action:
    'PASSO 2 de 2: executa o cancelamento/remarcação que você preparou e o usuário confirmou. Só use depois que o usuário responder "sim" à sua pergunta de confirmação, na mensagem seguinte à que você preparou; o servidor recusa se for na mesma mensagem. Executa exatamente o que foi preparado (não aceita parâmetros). Se o usuário recusar ou mudar de ideia, NÃO chame.',
  create_reminder:
    'Cria um lembrete pessoal: na data/hora indicada o IAzen manda o texto por WhatsApp para o próprio profissional (não para clientes). A data/hora precisa estar no futuro.',
  list_reminders:
    'Lista os lembretes pessoais (padrão: os pendentes) com id, texto e horário.',
  cancel_reminder:
    'Cancela um lembrete pessoal pendente (id vindo de list_reminders).',
};

/** Definições no formato da API da Anthropic (input_schema derivado do zod). */
export const ASSISTANT_TOOLS: Anthropic.Tool[] = TOOL_NAMES.map((name) => {
  const { $schema: _ignored, ...schema } = z.toJSONSchema(toolSchemas[name], {
    io: 'input',
  }) as Record<string, unknown>;
  void _ignored;
  return {
    name,
    description: DESCRIPTIONS[name],
    input_schema: schema as Anthropic.Tool.InputSchema,
  };
});

export type ParsedToolCall =
  | { ok: true; name: ToolName; input: unknown }
  | { ok: false; error: string };

/** Valida o input que a IA mandou para a ferramenta `name`. */
export function parseToolInput(name: string, input: unknown): ParsedToolCall {
  if (!(name in toolSchemas)) {
    return { ok: false, error: `Ferramenta desconhecida: ${name}` };
  }
  const toolName = name as ToolName;
  const parsed = toolSchemas[toolName].safeParse(input ?? {});
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || 'entrada'}: ${i.message}`)
      .join('; ');
    return { ok: false, error: `Parâmetros inválidos — ${detail}` };
  }
  return { ok: true, name: toolName, input: parsed.data };
}
