// Regras PURAS do painel inicial sobre a conta: saudação, checklist de configuração
// e dias de teste. Sem banco, sem rede.
import { saoPauloParts } from '../assistant/datetime';
import type { PlanStatus } from '../../types/database';

/** "Bom dia" (5h–11h59), "Boa tarde" (12h–17h59) ou "Boa noite", no relógio de São Paulo. */
export function greeting(now: Date): string {
  const { hour } = saoPauloParts(now);
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export type SetupKey = 'whatsapp' | 'availability' | 'services' | 'google';

export type SetupItem = {
  key: SetupKey;
  title: string;
  /** O que a pessoa ganha ao fazer. */
  why: string;
  href: string;
  cta: string;
  done: boolean;
  /** Essencial para a secretária trabalhar (WhatsApp e horários). */
  essential: boolean;
};

export type Setup = {
  items: SetupItem[];
  doneCount: number;
  total: number;
  /** 0–100 */
  pct: number;
  complete: boolean;
  essentialDone: boolean;
  /** Primeiro item pendente, essenciais antes. */
  next: SetupItem | null;
};

export function buildSetup(input: {
  whatsappConnected: boolean;
  /** Blocos semanais ativos (sem almoço). */
  weeklyBlocks: number;
  /** Serviços ativos. */
  services: number;
  googleConnected: boolean;
}): Setup {
  const items: SetupItem[] = [
    {
      key: 'whatsapp',
      title: 'Conectar o WhatsApp',
      why: 'Sem isso a secretária não recebe nem responde ninguém.',
      href: '/configuracoes/whatsapp',
      cta: 'Conectar WhatsApp',
      done: input.whatsappConnected,
      essential: true,
    },
    {
      key: 'availability',
      title: 'Definir seus horários de atendimento',
      why: 'É a partir deles que a IA sabe o que pode oferecer.',
      href: '/configuracoes/disponibilidade',
      cta: 'Definir horários',
      done: input.weeklyBlocks > 0,
      essential: true,
    },
    {
      key: 'services',
      title: 'Cadastrar seus serviços',
      why: 'Cada serviço tem duração e preço, e a IA usa isso ao marcar.',
      href: '/configuracoes/servicos',
      cta: 'Cadastrar serviços',
      done: input.services > 0,
      essential: false,
    },
    {
      key: 'google',
      title: 'Conectar o Google Agenda',
      why: 'Seus compromissos de fora bloqueiam horário e os atendimentos vão para o seu calendário.',
      href: '/configuracoes/google',
      cta: 'Conectar Google Agenda',
      done: input.googleConnected,
      essential: false,
    },
  ];
  const doneCount = items.filter((i) => i.done).length;
  return {
    items,
    doneCount,
    total: items.length,
    pct: Math.round((doneCount / items.length) * 100),
    complete: doneCount === items.length,
    essentialDone: items.filter((i) => i.essential).every((i) => i.done),
    next: items.find((i) => !i.done) ?? null,
  };
}

export type TrialInfo = {
  /** Dias inteiros que faltam (arredondado para cima). 0 = já terminou. */
  daysLeft: number;
  ended: boolean;
};

/** Só existe para quem está em teste (`trialing`) e tem data de fim. */
export function trialInfo(
  planStatus: PlanStatus,
  trialEndsAt: string | null,
  now: Date,
): TrialInfo | null {
  if (planStatus !== 'trialing' || !trialEndsAt) return null;
  const ms = Date.parse(trialEndsAt) - now.getTime();
  if (Number.isNaN(ms)) return null;
  const daysLeft = Math.max(0, Math.ceil(ms / 86_400_000));
  return { daysLeft, ended: ms <= 0 };
}
