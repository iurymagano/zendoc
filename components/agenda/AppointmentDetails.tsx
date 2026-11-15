'use client';

import type { ReactNode } from 'react';
import { FileText, Pencil, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/appointments/StatusBadge';
import { TZ, formatTime } from '@/components/agenda/calendar-utils';
import { isPersonalCommitment } from '@/lib/appointments/personal';
import { formatPhoneBR } from '@/lib/phone';
import type { Appointment, AppointmentStatus, BookedVia } from '@/types/database';

const SOURCE_LABEL: Record<BookedVia, string> = {
  whatsapp_ai: 'IA no WhatsApp',
  manual: 'Manual',
};

export type AppointmentHandlers = {
  onEdit: (a: Appointment) => void;
  onSetStatus: (id: string, status: AppointmentStatus) => void;
  onCancel: (a: Appointment) => void;
  onStopSeries: (a: Appointment) => void;
};

function formatLongDate(iso: string): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Botões de status do atendimento, com as mesmas regras de antes: compromisso
 * pessoal só cancela; pendente aprova/rejeita; agendado confirma/cancela;
 * confirmado marca falta/cancela; cancelado e faltou não têm ação de status.
 */
function StatusActions({
  a,
  handlers,
}: {
  a: Appointment;
  handlers: AppointmentHandlers;
}) {
  if (isPersonalCommitment(a.patient_phone)) {
    if (a.status === 'cancelled' || a.status === 'no_show') return null;
    return (
      <Button type="button" size="sm" variant="destructive" onClick={() => handlers.onCancel(a)}>
        Cancelar compromisso
      </Button>
    );
  }
  if (a.status === 'pending_approval') {
    return (
      <>
        <Button type="button" size="sm" onClick={() => handlers.onSetStatus(a.id, 'scheduled')}>
          Aprovar
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={() => handlers.onCancel(a)}>
          Rejeitar
        </Button>
      </>
    );
  }
  if (a.status === 'scheduled') {
    return (
      <>
        <Button type="button" size="sm" onClick={() => handlers.onSetStatus(a.id, 'confirmed')}>
          Confirmar
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={() => handlers.onCancel(a)}>
          Cancelar
        </Button>
      </>
    );
  }
  if (a.status === 'confirmed') {
    return (
      <>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handlers.onSetStatus(a.id, 'no_show')}
        >
          Não compareceu
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={() => handlers.onCancel(a)}>
          Cancelar
        </Button>
      </>
    );
  }
  return null;
}

/**
 * Conteúdo dos detalhes de um atendimento (dentro do Dialog/Sheet): status,
 * data, horário, cliente, serviço, origem, anotações e as ações. O título (nome)
 * fica no cabeçalho da sobreposição.
 */
export function AppointmentDetails({
  appointment: a,
  serviceName,
  handlers,
}: {
  appointment: Appointment;
  serviceName?: string;
  handlers: AppointmentHandlers;
}) {
  const personal = isPersonalCommitment(a.patient_phone);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={a.status} />
        {a.recurrence_id && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
            <Repeat className="size-3" aria-hidden="true" />
            Série
          </span>
        )}
      </div>

      <dl className="divide-y divide-border/70">
        <Row label="Data">{formatLongDate(a.starts_at)}</Row>
        <Row label="Horário">
          <span className="font-mono tabular-nums">
            {formatTime(a.starts_at)} – {formatTime(a.ends_at)}
          </span>
        </Row>
        {!personal && <Row label="Telefone">
          <span className="font-mono tabular-nums">{formatPhoneBR(a.patient_phone)}</span>
        </Row>}
        {serviceName && <Row label="Serviço">{serviceName}</Row>}
        {!personal && <Row label="Origem">{SOURCE_LABEL[a.booked_via]}</Row>}
        {a.notes && (
          <Row label="Anotações">
            <span className="whitespace-pre-wrap font-normal">{a.notes}</span>
          </Row>
        )}
        {a.status === 'cancelled' && (a.cancellation_note || a.cancelled_by) && (
          <Row label="Cancelamento">
            <span className="font-normal">
              {a.cancelled_by === 'patient'
                ? 'Pelo cliente'
                : a.cancelled_by === 'professional'
                  ? 'Por você'
                  : null}
              {a.cancelled_by && a.cancellation_note ? '. ' : ''}
              {a.cancellation_note}
            </span>
          </Row>
        )}
      </dl>

      {a.recurrence_id && (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-foreground">
          Este atendimento faz parte de uma série recorrente. Editar ou cancelar aqui
          afeta só esta ocorrência; use “Encerrar série” para cancelar as futuras.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusActions a={a} handlers={handlers} />
        <Button type="button" size="sm" variant="outline" onClick={() => handlers.onEdit(a)}>
          <Pencil data-icon="inline-start" aria-hidden="true" />
          Editar
        </Button>
        {a.status !== 'cancelled' && !personal && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.open(`/documentos/declaracao/${a.id}`, '_blank')}
          >
            <FileText data-icon="inline-start" aria-hidden="true" />
            Declaração
          </Button>
        )}
        {a.recurrence_id && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handlers.onStopSeries(a)}
          >
            Encerrar série
          </Button>
        )}
      </div>
    </div>
  );
}
