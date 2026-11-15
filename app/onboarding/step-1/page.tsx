'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { maskPhone } from '@/lib/masks';
import { isValidPhoneBR, normalizePhoneBR } from '@/lib/phone';
import { FormField } from '@/components/ui/form-field';
import { StepHeader } from '@/components/onboarding/StepHeader';

const STORAGE_KEY = 'iazen:onboarding:step1';

export default function OnboardingStep1() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Restaura o rascunho do sessionStorage depois de montar (no servidor ele
  // não existe; ler no useState inicial quebraria a hidratação).
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      /* eslint-disable react-hooks/set-state-in-effect -- sincroniza com armazenamento externo após o mount */
      setName(parsed.name ?? '');
      setPhone(maskPhone(parsed.phone ?? ''));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError('Informe seu nome completo.');
      return;
    }
    // normalizePhoneBR só prefixa o 55 quando faltar o DDI (10/11 dígitos), então
    // o DDD 55 (RS) não é confundido com o código do país.
    const normalized = normalizePhoneBR(phone);
    if (!isValidPhoneBR(normalized)) {
      setError('Informe um telefone válido com DDD.');
      return;
    }
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ name: name.trim(), phone: normalized }),
    );
    router.push('/onboarding/step-2');
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        current={1}
        title="Seus dados pessoais"
        subtitle="Vamos começar pelo básico."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label="Nome completo" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Ana Silva"
          />
        </FormField>
        <FormField label="WhatsApp" htmlFor="phone">
          <MaskedInput
            mask="phone"
            id="phone"
            name="phone"
            required
            value={phone}
            onChangeValue={setPhone}
          />
        </FormField>
        {error && (
          <span role="alert" className="text-sm font-medium text-destructive">
            {error}
          </span>
        )}
        <Button type="submit" size="lg">
          Continuar
        </Button>
      </form>
    </div>
  );
}
