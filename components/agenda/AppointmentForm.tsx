'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { MaskedInput } from '@/components/ui/masked-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_DURATION_MIN,
  EMPTY_FORM,
  REPEAT_ITEMS,
  addMinutesToLocal,
  isoToLocal,
  localToISO,
  type FormState,
  type Repeat,
} from '@/components/agenda/agenda-utils';
import { formatCpf, isValidCpf, normalizeCpf } from '@/lib/patients/cpf';
import { maskPhone } from '@/lib/masks';
import { isPersonalCommitment } from '@/lib/appointments/personal';
import { formatPhoneBR, isValidPhoneBR, normalizePhoneBR } from '@/lib/phone';
import type { Appointment, Patient, Service } from '@/types/database';

type Props = {
  /** Atendimento em edição; `null` = novo. */
  editing: Appointment | null;
  /** Início sugerido (`yyyy-MM-ddTHH:mm`) para um atendimento novo. */
  initialStart?: string;
  patients: Patient[];
  services: Service[];
  onCancel: () => void;
  /** Chamado depois de salvar: recarrega os dados e fecha a sobreposição. */
  onSaved: () => Promise<void>;
};

function initialForm(editing: Appointment | null, initialStart?: string): FormState {
  if (editing) {
    return {
      patient_name: editing.patient_name,
      patient_phone: isPersonalCommitment(editing.patient_phone)
        ? editing.patient_phone
        : maskPhone(editing.patient_phone),
      patient_cpf: '',
      starts_local: isoToLocal(editing.starts_at),
      ends_local: isoToLocal(editing.ends_at),
      notes: editing.notes ?? '',
      repeat: 'none',
      until: '',
      service_id: editing.service_id ?? '',
    };
  }
  const starts = initialStart ?? '';
  return {
    ...EMPTY_FORM,
    starts_local: starts,
    ends_local: addMinutesToLocal(starts, DEFAULT_DURATION_MIN),
  };
}

/**
 * Formulário de novo/editar atendimento. O estado vive aqui e nasce de `editing`
 * / `initialStart`; quem usa monta o componente de novo a cada abertura. Salva
 * com os mesmos endpoints de sempre (POST/PATCH /api/appointments e
 * POST /api/recurrences para série).
 */
export function AppointmentForm({
  editing,
  initialStart,
  patients,
  services,
  onCancel,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(() => initialForm(editing, initialStart));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const editingPersonal = !!editing && isPersonalCommitment(editing.patient_phone);

  const suggestions = useMemo(() => {
    const rawQuery = form.patient_name.trim().toLowerCase();
    const digits = form.patient_name.replace(/\D/g, '');
    // Sem digitar nada não abre a lista (ela cobria os campos de baixo ao focar).
    if (!rawQuery && !digits) return [];
    return patients
      .filter((p) => {
        const matchName = rawQuery && p.name.toLowerCase().includes(rawQuery);
        const matchPhone = digits && p.phone.includes(digits);
        return matchName || matchPhone;
      })
      .slice(0, 8);
  }, [patients, form.patient_name]);

  function pickPatient(p: Patient) {
    setForm((prev) => ({
      ...prev,
      patient_name: p.name,
      patient_phone: maskPhone(p.phone),
      patient_cpf: p.cpf ? formatCpf(p.cpf) : '',
    }));
    setSuggestionsOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Compromisso pessoal (criado pelo Assistente) não tem cliente: sem telefone.
    const phone = editingPersonal ? '' : normalizePhoneBR(form.patient_phone);
    if (!editingPersonal && !isValidPhoneBR(phone)) {
      setFormError('Informe um telefone válido com DDD (ex.: (11) 91111-2222).');
      return;
    }
    if (!form.patient_name.trim()) {
      setFormError('Nome é obrigatório.');
      return;
    }
    if (!form.starts_local || !form.ends_local) {
      setFormError('Defina início e fim do atendimento.');
      return;
    }
    if (form.starts_local >= form.ends_local) {
      setFormError('O horário final precisa ser maior que o inicial.');
      return;
    }
    if (
      !editing &&
      form.repeat !== 'none' &&
      form.starts_local.slice(0, 10) !== form.ends_local.slice(0, 10)
    ) {
      setFormError(
        'Para repetir, início e fim devem ser no mesmo dia — eles definem o horário de UM atendimento. Use "Repetir até" para a data em que a série termina.',
      );
      return;
    }
    const cpf = normalizeCpf(form.patient_cpf);
    if (cpf && !isValidCpf(cpf)) {
      setFormError('CPF inválido.');
      return;
    }

    setSaving(true);

    // Atendimento recorrente (só na criação): cria a série e materializa as
    // ocorrências; senão, fluxo normal de appointment único.
    if (!editing && form.repeat !== 'none') {
      const res = await fetch('/api/recurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: form.patient_name.trim(),
          patient_phone: phone,
          cpf: cpf || null,
          starts_at: localToISO(form.starts_local),
          ends_at: localToISO(form.ends_local),
          frequency: form.repeat,
          until: form.until || null,
          notes: form.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        setFormError(body.error ?? 'Erro ao criar a recorrência.');
        return;
      }
      await onSaved();
      const created = Number(body.created ?? 0);
      const skipped = Number(body.skipped ?? 0);
      const clash =
        skipped > 0
          ? ` ${skipped} ${skipped === 1 ? 'data ficou' : 'datas ficaram'} de fora por conflito de horário.`
          : '';
      if (created > 0) {
        toast.success(
          `Série criada: ${created} ${created === 1 ? 'atendimento marcado' : 'atendimentos marcados'}.${clash}`,
        );
      } else {
        toast.warning(`Série criada, mas nenhum atendimento foi marcado.${clash}`);
      }
      return;
    }

    const payload = {
      patient_name: form.patient_name.trim(),
      patient_phone: phone,
      cpf: cpf || null,
      starts_at: localToISO(form.starts_local),
      ends_at: localToISO(form.ends_local),
      notes: form.notes.trim() || null,
      service_id: form.service_id || null,
    };
    const url = editing ? `/api/appointments/${editing.id}` : '/api/appointments';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSaving(false);
      setFormError(body.error ?? 'Erro ao salvar agendamento.');
      return;
    }

    await onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {editing?.recurrence_id && (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-foreground">
          Este atendimento faz parte de uma série recorrente. Editar aqui afeta só
          esta ocorrência; para cancelar as futuras, use “Encerrar série” nos
          detalhes.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={editingPersonal ? 'Título do compromisso' : 'Nome do cliente'}
          htmlFor="ap_name"
          className={editingPersonal ? 'sm:col-span-2' : undefined}
        >
          <div className="relative">
            <Input
              id="ap_name"
              value={form.patient_name}
              onChange={(e) => {
                setForm((p) => ({ ...p, patient_name: e.target.value }));
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              autoComplete="off"
              required
              maxLength={120}
            />
            {suggestionsOpen && suggestions.length > 0 && !editingPersonal && (
              <ul className="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-auto rounded-xl bg-popover p-1 shadow-pop ring-1 ring-border">
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickPatient(p)}
                      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <span className="w-full truncate font-medium">{p.name}</span>
                      <span className="w-full truncate text-xs text-muted-foreground">
                        {formatPhoneBR(p.phone)}
                        {p.cpf ? ` · ${formatCpf(p.cpf)}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormField>
        {!editingPersonal && (
          <>
            <FormField label="Telefone" htmlFor="ap_phone">
              <MaskedInput
                mask="phone"
                id="ap_phone"
                value={form.patient_phone}
                onChangeValue={(v) => setForm((p) => ({ ...p, patient_phone: v }))}
                required
              />
            </FormField>
            <FormField label="CPF (opcional)" htmlFor="ap_cpf">
              <MaskedInput
                mask="cpf"
                id="ap_cpf"
                value={form.patient_cpf}
                onChangeValue={(v) => setForm((p) => ({ ...p, patient_cpf: v }))}
              />
            </FormField>
          </>
        )}
      </div>

      {services.length > 0 && (
        <FormField label="Serviço (opcional)" htmlFor="ap_service">
          <Select
            items={{
              none: 'Nenhum',
              ...Object.fromEntries(
                services.map((s) => [s.id, `${s.name} · ${s.duration_min}min`]),
              ),
            }}
            value={form.service_id || 'none'}
            onValueChange={(v) =>
              setForm((p) => {
                const id = v === 'none' ? '' : ((v as string) ?? '');
                const dur =
                  services.find((s) => s.id === id)?.duration_min ??
                  DEFAULT_DURATION_MIN;
                const ends_local = p.starts_local
                  ? addMinutesToLocal(p.starts_local, dur)
                  : p.ends_local;
                return { ...p, service_id: id, ends_local };
              })
            }
          >
            <SelectTrigger id="ap_service" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {s.duration_min}min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Ao escolher, o fim é calculado pela duração do serviço.
          </p>
        </FormField>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Início" htmlFor="ap_start">
          <Input
            id="ap_start"
            type="datetime-local"
            value={form.starts_local}
            onChange={(e) => {
              const starts = e.target.value;
              setForm((p) => {
                const dur =
                  services.find((s) => s.id === p.service_id)?.duration_min ??
                  DEFAULT_DURATION_MIN;
                return {
                  ...p,
                  starts_local: starts,
                  ends_local:
                    !p.ends_local || p.ends_local <= starts
                      ? addMinutesToLocal(starts, dur)
                      : p.ends_local,
                };
              });
            }}
            required
          />
        </FormField>
        <FormField label="Fim" htmlFor="ap_end">
          <Input
            id="ap_end"
            type="datetime-local"
            value={form.ends_local}
            onChange={(e) => setForm((p) => ({ ...p, ends_local: e.target.value }))}
            required
          />
        </FormField>
      </div>

      {!editing && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Repetir" htmlFor="ap_repeat">
              <Select
                items={REPEAT_ITEMS}
                value={form.repeat}
                onValueChange={(v) =>
                  setForm((p) => {
                    const repeat = (v ?? 'none') as Repeat;
                    // Ao ativar a repetição, garante que o fim fique no
                    // mesmo dia do início (é o horário de UM atendimento).
                    const sameDay =
                      p.starts_local.slice(0, 10) === p.ends_local.slice(0, 10);
                    const ends_local =
                      repeat !== 'none' && p.starts_local && !sameDay
                        ? addMinutesToLocal(p.starts_local, DEFAULT_DURATION_MIN)
                        : p.ends_local;
                    return { ...p, repeat, ends_local };
                  })
                }
              >
                <SelectTrigger id="ap_repeat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não repete</SelectItem>
                  <SelectItem value="weekly">Toda semana</SelectItem>
                  <SelectItem value="biweekly">A cada 2 semanas</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {form.repeat !== 'none' && (
              <FormField label="Repetir até (opcional)" htmlFor="ap_until">
                <Input
                  id="ap_until"
                  type="date"
                  value={form.until}
                  onChange={(e) => setForm((p) => ({ ...p, until: e.target.value }))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Data em que a repetição para. Deixe vazio para repetir sem fim.
                </p>
              </FormField>
            )}
          </div>
          {form.repeat !== 'none' && (
            <p className="-mt-1 text-xs text-muted-foreground">
              <strong>Início</strong> e <strong>Fim</strong> acima são o horário de{' '}
              <strong>um</strong> atendimento (mesmo dia). Ela vai se repetir{' '}
              {form.repeat === 'weekly' ? 'toda semana' : 'a cada 2 semanas'} no mesmo
              dia e horário, até a data de “Repetir até”.
            </p>
          )}
        </>
      )}

      <FormField label="Anotações (opcional)" htmlFor="ap_notes">
        <Textarea
          id="ap_notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
          placeholder="Ex.: primeiro atendimento, indicação, observações, etc."
        />
      </FormField>

      {formError && (
        <div role="alert" className="text-sm text-destructive-ink">
          {formError}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 max-md:sticky max-md:bottom-0 max-md:-mx-4 max-md:-mb-4 max-md:bg-popover max-md:px-4 max-md:pt-3 max-md:pb-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar agendamento'}
        </Button>
      </div>
    </form>
  );
}
