'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError('Email ou senha inválidos.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Entrar</h1>
        <p className="text-sm text-zinc-600 mt-1">Acesse sua conta Zendoc</p>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() => signIn('google', { callbackUrl })}
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
          label="Senha"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <span className="text-sm text-red-600">{error}</span>}
        <Button type="submit" loading={loading}>
          Entrar
        </Button>
      </form>

      <p className="text-sm text-zinc-600 text-center">
        Não tem conta?{' '}
        <Link href="/register" className="text-emerald-700 font-medium">
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-32" />}>
      <LoginForm />
    </Suspense>
  );
}
