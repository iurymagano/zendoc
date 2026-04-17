'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { StepHeader } from '@/components/onboarding/StepHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STEP1_KEY = 'zendoc:onboarding:step1';

const SPECIALTIES = [
  'Psicólogo(a)',
  'Psicanalista',
  'Nutricionista',
  'Fisioterapeuta',
  'Terapeuta',
  'Fonoaudiólogo(a)',
  'Outro',
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [specialty, setSpecialty] = useState('');
  const [address, setAddress] = useState('');
  const [tone, setTone] = useState<'amigável' | 'formal'>('amigável');
  const [customInstructions, setCustomInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STEP1_KEY)) {
      router.replace('/onboarding/step-1');
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const step1 = sessionStorage.getItem(STEP1_KEY);
    if (!step1) {
      router.replace('/onboarding/step-1');
      return;
    }
    if (specialty.trim().length === 0) {
      setError('Selecione sua especialidade.');
      return;
    }

    const { name, phone } = JSON.parse(step1);

    setLoading(true);
    const res = await fetch('/api/onboarding/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        specialty,
        address: address.trim() || null,
        tone,
        custom_instructions: customInstructions.trim() || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? 'Erro ao salvar perfil. Tente novamente.');
      return;
    }
    sessionStorage.removeItem(STEP1_KEY);
    router.push('/configuracoes/disponibilidade?onboarding=1');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        current={2}
        title="Perfil do consultório"
        subtitle="Essas informações ajudam a IA a conversar com seus pacientes."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label="Especialidade" htmlFor="specialty">
          <Select
            value={specialty}
            onValueChange={(v) => setSpecialty(v ?? '')}
          >
            <SelectTrigger id="specialty">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Endereço do consultório (opcional)"
          htmlFor="address"
        >
          <Input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
          />
        </FormField>

        <FormField label="Tom das respostas da secretária virtual">
          <div className="grid grid-cols-2 gap-2">
            {(['amigável', 'formal'] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={tone === t ? 'default' : 'outline'}
                size="lg"
                onClick={() => setTone(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </FormField>

        <FormField
          label="Instruções especiais para a IA (opcional)"
          htmlFor="custom_instructions"
        >
          <Textarea
            id="custom_instructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            placeholder="Ex.: primeira consulta dura 60min; peço para pacientes chegarem 10min antes."
          />
        </FormField>

        {error && <span className="text-sm text-destructive">{error}</span>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push('/onboarding/step-1')}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button type="submit" size="lg" disabled={loading} className="flex-1">
            {loading ? 'Salvando…' : 'Continuar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
