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
export type AIAction =
  | 'book'
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
  plan_status: PlanStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
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
  created_at: string;
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
  };
  cancel?: {
    appointment_id: string;
  };
  slots?: string[];
}
