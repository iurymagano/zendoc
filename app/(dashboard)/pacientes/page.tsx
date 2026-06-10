'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatCpf, isValidCpf, maskCpfInput, normalizeCpf } from '@/lib/patients/cpf';
import type { Patient } from '@/types/database';

type FormState = {
  name: string;
  phone: string;
  cpf: string;
  notes: string;
  messaging_opted_out: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  cpf: '',
  notes: '',
  messaging_opted_out: false,
};

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 13) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 12) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return raw;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const body = await res.json();
        setPatients(body.patients ?? []);
      }
      setLoaded(true);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    const digits = q.replace(/\D/g, '');
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (!!digits && !!p.cpf && p.cpf.includes(digits)),
    );
  }, [patients, search]);

  async function reload() {
    const res = await fetch('/api/patients');
    if (res.ok) {
      const body = await res.json();
      setPatients(body.patients ?? []);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(patient: Patient) {
    setEditingId(patient.id);
    setForm({
      name: patient.name,
      phone: patient.phone,
      cpf: patient.cpf ? formatCpf(patient.cpf) : '',
      notes: patient.notes ?? '',
      messaging_opted_out: patient.messaging_opted_out ?? false,
    });
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const phone = form.phone.replace(/\D/g, '');
    if (phone.length < 11 || phone.length > 13) {
      setError('Telefone deve ter 11 a 13 dígitos (com DDI e DDD).');
      return;
    }
    if (!form.name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    const cpf = normalizeCpf(form.cpf);
    if (cpf && !isValidCpf(cpf)) {
      setError('CPF inválido.');
      return;
    }

    setSaving(true);
    const url = editingId ? `/api/patients/${editingId}` : '/api/patients';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        phone,
        cpf: cpf || null,
        notes: form.notes.trim() || null,
        messaging_opted_out: form.messaging_opted_out,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? 'Erro ao salvar paciente.');
      return;
    }

    await reload();
    closeForm();
  }

  async function remove(patient: Patient) {
    const ok = window.confirm(
      `Excluir ${patient.name}? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;

    const res = await fetch(`/api/patients/${patient.id}`, { method: 'DELETE' });
    if (res.ok) await reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pacientes"
        title="Seu cadastro"
        description="Base central usada em agendamentos manuais e no fluxo da IA pelo WhatsApp."
        actions={
          !formOpen ? <Button onClick={openCreate}>Novo paciente</Button> : null
        }
      />

        {formOpen && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Editar paciente' : 'Novo paciente'}
              </CardTitle>
              <CardDescription>
                Telefone no formato internacional (ex.: 5511999998888) ou
                apenas com DDD — os caracteres não numéricos são removidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nome" htmlFor="pat_name">
                    <Input
                      id="pat_name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                      maxLength={120}
                    />
                  </FormField>
                  <FormField label="Telefone" htmlFor="pat_phone">
                    <Input
                      id="pat_phone"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="5511999998888"
                      required
                    />
                  </FormField>
                  <FormField label="CPF (opcional)" htmlFor="pat_cpf">
                    <Input
                      id="pat_cpf"
                      value={form.cpf}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, cpf: maskCpfInput(e.target.value) }))
                      }
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />
                  </FormField>
                </div>

                <FormField label="Anotações (opcional)" htmlFor="pat_notes">
                  <Textarea
                    id="pat_notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Histórico clínico, preferências, observações privadas…"
                  />
                </FormField>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      Não enviar mensagens ativas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      LGPD — o paciente optou por não receber lembretes pelo
                      WhatsApp. Conversas iniciadas por ele continuam funcionando.
                    </p>
                  </div>
                  <Switch
                    checked={form.messaging_opted_out}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, messaging_opted_out: v }))
                    }
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? 'Salvando…'
                      : editingId
                        ? 'Salvar alterações'
                        : 'Adicionar paciente'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de pacientes</CardTitle>
            <CardDescription>
              {loaded
                ? `${patients.length} paciente${patients.length === 1 ? '' : 's'} cadastrado${patients.length === 1 ? '' : 's'}.`
                : 'Carregando…'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              placeholder="Buscar por nome, telefone ou CPF…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {!loaded ? (
              <div className="flex flex-col divide-y">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : patients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum paciente cadastrado"
                description="Cadastre seus pacientes aqui — eles também são criados automaticamente quando a IA agenda pelo WhatsApp."
              >
                <Button onClick={openCreate}>Novo paciente</Button>
              </EmptyState>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum paciente encontrado para essa busca.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {filtered.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{p.name}</span>
                        {p.messaging_opted_out && (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground ring-1 ring-border">
                            sem mensagens
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatPhone(p.phone)}
                        {p.cpf ? ` · CPF ${formatCpf(p.cpf)}` : ''}
                        {p.notes ? ` · ${p.notes}` : ''}
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link
                        href={`/pacientes/${p.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        Histórico
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => remove(p)}
                      >
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
