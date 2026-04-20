'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Separator } from '@/components/ui/separator';

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
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Bem-vindo de volta
        </span>
        <h1
          className="mt-2 font-display text-3xl font-semibold tracking-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          Entrar no IAzen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse sua secretária virtual.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => signIn('google', { callbackUrl })}
      >
        Continuar com Google
      </Button>

      <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
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
        <FormField label="Senha" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {error && <span className="text-sm text-destructive">{error}</span>}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Não tem conta?{' '}
        <Link href="/register" className="text-foreground font-medium underline">
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
