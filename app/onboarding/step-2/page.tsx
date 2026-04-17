'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StepHeader } from '@/components/onboarding/StepHeader';

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
    router.push('/dashboard');
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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">
            Especialidade
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            required
            className="h-11 px-3 rounded-lg border border-zinc-300 bg-white text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
          >
            <option value="">Selecione…</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Input
          name="address"
          label="Endereço do consultório (opcional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rua, número, bairro, cidade"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">
            Tom das respostas da secretária virtual
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['amigável', 'formal'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`h-11 rounded-lg border text-sm font-medium capitalize transition-colors ${
                  tone === t
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="custom_instructions"
            className="text-sm font-medium text-zinc-700"
          >
            Instruções especiais para a IA (opcional)
          </label>
          <textarea
            id="custom_instructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            placeholder="Ex.: primeira consulta dura 60min; peço para pacientes chegarem 10min antes."
            className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        {error && <span className="text-sm text-red-600">{error}</span>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/onboarding/step-1')}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Finalizar
          </Button>
        </div>
      </form>
    </div>
  );
}
