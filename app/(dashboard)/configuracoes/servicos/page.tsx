'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import type { Service } from '@/types/database';

function formatPrice(cents: number | null): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** "150", "150,50", "R$ 150,50" → centavos. Vazio → null. */
function priceToCents(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

type FormState = { name: string; duration_min: string; price: string };
const EMPTY: FormState = { name: '', duration_min: '50', price: '' };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [buffer, setBuffer] = useState('0');
  const [bufferSaving, setBufferSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [svcRes, profRes] = await Promise.all([
      fetch('/api/services'),
      fetch('/api/professionals'),
    ]);
    if (svcRes.ok) setServices((await svcRes.json()).services ?? []);
    if (profRes.ok) {
      const body = await profRes.json();
      setBuffer(String(body.professional?.buffer_min ?? 0));
    }
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      duration_min: String(s.duration_min),
      price: s.price_cents != null ? String(s.price_cents / 100).replace('.', ',') : '',
    });
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const duration = Number(form.duration_min);
    if (!form.name.trim()) return setError('Dê um nome ao serviço.');
    if (!Number.isInteger(duration) || duration < 5 || duration > 600) {
      return setError('Duração deve ser entre 5 e 600 minutos.');
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      duration_min: duration,
      price_cents: priceToCents(form.price),
    };
    const res = await fetch(
      editingId ? `/api/services/${editingId}` : '/api/services',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(body.error ?? 'Erro ao salvar serviço.');
    resetForm();
    await load();
  }

  async function toggleActive(s: Service) {
    await fetch(`/api/services/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    });
    await load();
  }

  async function remove(s: Service) {
    if (!window.confirm(`Excluir o serviço "${s.name}"?`)) return;
    await fetch(`/api/services/${s.id}`, { method: 'DELETE' });
    await load();
  }

  async function saveBuffer() {
    const value = Number(buffer);
    if (!Number.isInteger(value) || value < 0 || value > 240) return;
    setBufferSaving(true);
    await fetch('/api/professionals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buffer_min: value }),
    });
    setBufferSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Configurações"
        title="Serviços"
        description="Tipos de atendimento com duração e preço próprios. Ao agendar, o fim é calculado pela duração do serviço escolhido."
      />

      <Card>
        <CardHeader>
          <CardTitle>Intervalo entre atendimentos</CardTitle>
          <CardDescription>
            Folga (em minutos) que a IA respeita ao oferecer horários — evita
            encaixar uma consulta colada na outra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <FormField label="Minutos" htmlFor="buffer">
              <Input
                id="buffer"
                type="number"
                min={0}
                max={240}
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                className="w-28"
              />
            </FormField>
            <Button onClick={saveBuffer} disabled={bufferSaving}>
              {bufferSaving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Editar serviço' : 'Novo serviço'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField label="Nome" htmlFor="svc_name">
                <Input
                  id="svc_name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex.: Avaliação, Retorno, Sessão"
                  maxLength={80}
                  required
                />
              </FormField>
              <FormField label="Duração (min)" htmlFor="svc_dur">
                <Input
                  id="svc_dur"
                  type="number"
                  min={5}
                  max={600}
                  value={form.duration_min}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, duration_min: e.target.value }))
                  }
                  required
                />
              </FormField>
              <FormField label="Preço (R$, opcional)" htmlFor="svc_price">
                <Input
                  id="svc_price"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="150,00"
                  inputMode="decimal"
                />
              </FormField>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-end gap-3">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando…' : editingId ? 'Salvar' : 'Adicionar serviço'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seus serviços</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : services.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Nenhum serviço ainda"
              description="Cadastre seus tipos de atendimento (ex.: Avaliação, Retorno) com duração e preço — eles aparecem ao agendar e a IA usa para responder valores."
            />
          ) : (
            <ul className="flex flex-col divide-y">
              {services.map((s) => (
                <li
                  key={s.id}
                  className={`flex flex-wrap items-center justify-between gap-3 py-3 ${
                    s.active ? '' : 'opacity-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {s.name}
                      {!s.active && ' (inativo)'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.duration_min} min · {formatPrice(s.price_cents)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                      {s.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(s)}>
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
