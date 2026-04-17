'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Separator } from '@/components/ui/separator';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? 'Não foi possível criar sua conta.');
      setLoading(false);
      return;
    }

    const login = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (!login || login.error) {
      router.push('/login');
      return;
    }
    router.push('/onboarding/step-1');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trial de 7 dias. Sem cartão de crédito.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => signIn('google', { callbackUrl: '/onboarding/step-1' })}
      >
        Continuar com Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        ou
        <Separator className="flex-1" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Senha (mínimo 8 caracteres)" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <FormField label="Confirmar senha" htmlFor="confirm">
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </FormField>
        {error && <span className="text-sm text-destructive">{error}</span>}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Já tem conta?{' '}
        <Link href="/login" className="text-foreground font-medium underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
