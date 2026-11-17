// Contrato entre a camada de dados do painel admin (lib/admin/metrics.ts) e a
// tela (/admin). Tudo é calculado no servidor com a service key; a tela só lê.

import type { PlanStatus } from '@/types/database';

/** Um ponto de série diária (dia em America/Sao_Paulo, "yyyy-MM-dd"). */
export interface DailyPoint {
  day: string;
  value: number;
}

export interface AdminKpis {
  /** Contas criadas no Supabase Auth (inclui quem não terminou o onboarding). */
  accounts: number;
  /** Profissionais com onboarding concluído (linha em `professionals`). */
  professionals: number;
  /** plan_status = 'trialing' e teste ainda válido. */
  trialing: number;
  /** plan_status = 'trialing' com trial_ends_at no passado (teste vencido, não assinou). */
  trialExpired: number;
  /** plan_status = 'active' (pagantes). */
  paying: number;
  pastDue: number;
  cancelled: number;
  /** Receita mensal estimada em centavos: pagantes × preço (R$297). */
  mrrCents: number;
  /** Profissionais com WhatsApp conectado agora. */
  whatsappConnected: number;
  /** Usuários distintos que abriram o painel hoje / nos últimos 7 / 30 dias. */
  activeToday: number;
  active7d: number;
  active30d: number;
}

/** Funil dos últimos 30 dias, do topo ao fundo. */
export interface AdminFunnel {
  /** Visitas à landing (/) no período. */
  landingVisits: number;
  /** Visitas a /register no período. */
  registerVisits: number;
  /** Contas criadas no período. */
  signups: number;
  /** Onboarding concluído no período (professionals.created_at). */
  onboarded: number;
  /** Dos que concluíram o onboarding no período, quantos conectaram o WhatsApp. */
  whatsappConnected: number;
  /** Dos que concluíram o onboarding no período, quantos estão pagando. */
  paying: number;
}

export interface AdminUsage {
  /** Atendimentos criados (appointments.created_at), por origem, últimos 7 e 30 dias. */
  appointmentsByAi7d: number;
  appointmentsManual7d: number;
  appointments30d: number;
  /** Mensagens de clientes recebidas no WhatsApp (conversation_history role=user), 7 dias. */
  whatsappMessages7d: number;
  /** Mensagens do dono no Assistente pessoal (assistant_messages role=user), 7 dias. */
  assistantMessages7d: number;
  /** Lembretes para clientes nos últimos 7 dias. */
  remindersSent7d: number;
  remindersFailed7d: number;
}

export interface AdminUserRow {
  /** auth.users.id */
  userId: string;
  email: string;
  /** null quando a conta existe mas o onboarding não foi concluído. */
  professionalId: string | null;
  name: string | null;
  specialty: string | null;
  phone: string | null;
  planStatus: PlanStatus | null;
  trialEndsAt: string | null;
  whatsappConnected: boolean;
  aiEnabled: boolean;
  /** Conta criada (auth.users.created_at), ISO. */
  createdAt: string;
  /** Último dia/hora em que abriu o painel (activity_days), ISO ou null. */
  lastSeenAt: string | null;
  /** Atendimentos criados nos últimos 30 dias. */
  appointments30d: number;
  /** Login por Google ou e-mail/senha (do app_metadata do Supabase), quando houver. */
  provider: 'google' | 'email' | null;
}

export interface AdminOverview {
  /** Momento do cálculo, ISO. */
  generatedAt: string;
  kpis: AdminKpis;
  funnel30d: AdminFunnel;
  usage: AdminUsage;
  /** Últimos 30 dias, um ponto por dia (dias sem dado = 0). */
  series: {
    signups: DailyPoint[];
    activeUsers: DailyPoint[];
    landingVisits: DailyPoint[];
  };
  /** Todas as contas, mais recentes primeiro. */
  users: AdminUserRow[];
  /** Avisos de dados que não puderam ser lidos (ex.: tabela ainda não migrada). */
  warnings: string[];
}
