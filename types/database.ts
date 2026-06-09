export type PlanStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'pending_approval'
  | 'cancelled'
  | 'no_show';
export type BookedVia = 'whatsapp_ai' | 'manual';
export type BlockType = 'morning' | 'lunch' | 'afternoon';
export type ExceptionType = 'day_off' | 'custom_hours' | 'extra_day';
export type ReminderType = '24h' | '2h';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type ConversationRole = 'user' | 'assistant';
export type RecurrenceFrequency = 'weekly' | 'biweekly';
export type AIAction =
  | 'book'
  | 'confirm'
  | 'cancel'
  | 'reschedule'
  | 'offer_slots'
  | 'reply'
  | 'approval_needed';

export interface Professional {
  id: string;
  user_id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  address: string | null;
  tone: 'amigável' | 'formal';
  custom_instructions: string | null;
  ai_enabled: boolean;
  requires_approval: boolean;
  whatsapp_connected: boolean;
  zapi_instance_id: string | null;
  zapi_token: string | null;
  pending_qrcode: string | null;
  pending_qrcode_at: string | null;
  plan_status: PlanStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  // Google Calendar (integração mão-dupla — ver lib/google/)
  google_calendar_connected: boolean;
  google_email: string | null;
  google_refresh_token: string | null;
  google_access_token: string | null;
  google_token_expiry: string | null;
  google_calendar_id: string;
  google_sync_token: string | null;
  google_channel_id: string | null;
  google_resource_id: string | null;
  google_channel_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  professional_id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  booked_via: BookedVia;
  cancelled_by: 'patient' | 'professional' | null;
  cancellation_note: string | null;
  notes: string | null;
  google_event_id: string | null;
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Regra de uma série de consultas recorrentes (os appointments são materializados). */
export interface Recurrence {
  id: string;
  professional_id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  start_date: string; // 'yyyy-MM-dd' — 1ª sessão (âncora da cadência)
  weekday: number;
  start_time: string; // 'HH:mm:ss'
  end_time: string;
  interval_weeks: number; // 1=semanal, 2=quinzenal
  until: string | null; // término opcional (inclusive)
  active: boolean;
  notes: string | null;
  created_at: string;
}

/** Evento pessoal puxado do Google que bloqueia disponibilidade (read-only no IAzen). */
export interface GoogleBusyEvent {
  id: string;
  professional_id: string;
  google_event_id: string;
  summary: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  updated_at: string;
}

export interface AvailabilityWeekly {
  id: string;
  professional_id: string;
  weekday: number;
  block_type: BlockType;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilityException {
  id: string;
  professional_id: string;
  date: string;
  type: ExceptionType;
  start_time: string | null;
  end_time: string | null;
  slot_duration: number | null;
  note: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  professional_id: string;
  name: string;
  phone: string;
  cpf: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  appointment_id: string;
  professional_id: string;
  type: ReminderType;
  scheduled_for: string;
  status: ReminderStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  professional_id: string;
  patient_phone: string;
  role: ConversationRole;
  content: string;
  created_at: string;
}

export interface AIResponse {
  action: AIAction;
  message_to_patient: string;
  booking?: {
    starts_at: string;
    ends_at: string;
    patient_name?: string;
  };
  // appointment_id é opcional: a IA não conhece o uuid; o executor resolve a
  // próxima consulta do paciente pelo telefone quando não vier.
  cancel?: {
    appointment_id?: string;
  };
  slots?: string[];
}
