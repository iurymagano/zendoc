'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
        <h1 className="text-2xl font-semibold text-zinc-900">Criar conta</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Trial de 7 dias. Sem cartão de crédito.
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() => signIn('google', { callbackUrl: '/onboarding/step-1' })}
      >
        Continuar com Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <div className="flex-1 h-px bg-zinc-200" />
        ou
        <div className="flex-1 h-px bg-zinc-200" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          name="password"
          type="password"
          label="Senha (mínimo 8 caracteres)"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          name="confirm"
          type="password"
          label="Confirmar senha"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <span className="text-sm text-red-600">{error}</span>}
        <Button type="submit" loading={loading}>
          Criar conta
        </Button>
      </form>

      <p className="text-sm text-zinc-600 text-center">
        Já tem conta?{' '}
        <Link href="/login" className="text-emerald-700 font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
