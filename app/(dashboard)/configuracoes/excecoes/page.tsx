'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import type { AvailabilityException, ExceptionType } from '@/types/database';

const TYPE_LABELS: Record<ExceptionType, string> = {
  day_off: 'Dia bloqueado',
  custom_hours: 'Horário diferente',
  extra_day: 'Dia extra',
};

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState<ExceptionType>('day_off');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(50);
  const [note, setNote] = useState('');

  async function reload() {
    const res = await fetch('/api/availability/exceptions');
    if (res.ok) {
      const body = await res.json();
      setExceptions(body.exceptions ?? []);
    }
  }

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/availability/exceptions');
      if (res.ok) {
        const body = await res.json();
        setExceptions(body.exceptions ?? []);
      }
      setLoaded(true);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (type !== 'day_off' && startTime >= endTime) {
      setError('O horário final precisa ser maior que o inicial.');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/availability/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        type,
        start_time: type === 'day_off' ? null : startTime,
        end_time: type === 'day_off' ? null : endTime,
        slot_duration: type === 'day_off' ? null : slotDuration,
        note: note.trim() || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? 'Erro ao salvar exceção.');
      return;
    }

    setNote('');
    await reload();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/availability/exceptions/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) await reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Configurações"
        title="Exceções de agenda"
        description="Bloqueie feriados, configure horários diferentes em dias pontuais ou abra a agenda em dias que normalmente não atende. Exceções têm prioridade sobre a rotina semanal."
      />

        <Card>
          <CardHeader>
            <CardTitle>Nova exceção</CardTitle>
            <CardDescription>
              Se já existir uma exceção na mesma data, ela será substituída.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Data" htmlFor="exc_date">
                  <Input
                    id="exc_date"
                    type="date"
                    min={todayIso()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Tipo" htmlFor="exc_type">
                  <Select
                    value={type}
                    onValueChange={(v) =>
                      setType((v as ExceptionType) ?? 'day_off')
                    }
                  >
                    <SelectTrigger id="exc_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day_off">Dia bloqueado</SelectItem>
                      <SelectItem value="custom_hours">
                        Horário diferente
                      </SelectItem>
                      <SelectItem value="extra_day">Dia extra</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {type !== 'day_off' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Início" htmlFor="exc_start">
                    <Input
                      id="exc_start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Fim" htmlFor="exc_end">
                    <Input
                      id="exc_end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Duração (min)" htmlFor="exc_slot">
                    <Input
                      id="exc_slot"
                      type="number"
                      min={15}
                      max={240}
                      step={5}
                      value={slotDuration}
                      onChange={(e) =>
                        setSlotDuration(Number(e.target.value))
                      }
                    />
                  </FormField>
                </div>
              )}

              <FormField label="Observação (opcional)" htmlFor="exc_note">
                <Textarea
                  id="exc_note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: feriado municipal, plantão, congresso…"
                  rows={2}
                />
              </FormField>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <div className="flex items-center justify-end gap-3">
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? 'Salvando…' : 'Adicionar exceção'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas exceções</CardTitle>
            <CardDescription>
              Listagem ordenada pela data, incluindo datas passadas já
              registradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <div className="text-sm text-muted-foreground">
                Carregando exceções…
              </div>
            ) : exceptions.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma exceção cadastrada.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {exceptions.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {formatDateBr(e.date)} · {TYPE_LABELS[e.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {e.type === 'day_off'
                          ? 'Agenda bloqueada no dia inteiro'
                          : `${e.start_time?.slice(0, 5)} – ${e.end_time?.slice(
                              0,
                              5,
                            )}${
                              e.slot_duration
                                ? ` · ${e.slot_duration} min/consulta`
                                : ''
                            }`}
                        {e.note ? ` · ${e.note}` : ''}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(e.id)}
                    >
                      Excluir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
