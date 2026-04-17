'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { StepHeader } from '@/components/onboarding/StepHeader';

const STORAGE_KEY = 'zendoc:onboarding:step1';

export default function OnboardingStep1() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setName(parsed.name ?? '');
      setPhone(parsed.phone ?? '');
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError('Informe seu nome completo.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      setError('Informe um telefone válido com DDD.');
      return;
    }
    const normalized = digits.startsWith('55') ? digits : `55${digits}`;
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
            placeholder="Ex.: Dra. Ana Silva"
          />
        </FormField>
        <FormField label="WhatsApp" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </FormField>
        {error && <span className="text-sm text-destructive">{error}</span>}
        <Button type="submit" size="lg">
          Continuar
        </Button>
      </form>
    </div>
  );
}
