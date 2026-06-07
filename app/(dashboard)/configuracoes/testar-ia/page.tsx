'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import type { AIAction } from '@/types/database';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
  error?: boolean;
};

const ACTION_LABEL: Record<AIAction, string> = {
  book: '✅ agendou',
  cancel: '🗑️ cancelou',
  reschedule: '🔄 remarcou',
  offer_slots: '📅 ofereceu horários',
  reply: '💬 respondeu',
  approval_needed: '⏳ aguardando aprovação',
};

const SUGGESTIONS = [
  'Oi, queria marcar uma consulta',
  'Quais horários você tem essa semana?',
  'Preciso remarcar minha consulta',
  'Qual o endereço do consultório?',
];

/** Gera um telefone fake claramente identificável (prefixo 5500) para o teste. */
function newTestPhone(): string {
  const rand = Math.floor(Math.random() * 1_0000_0000)
    .toString()
    .padStart(8, '0');
  return `5500${rand}`;
}

export default function TestarIaPage() {
  const [phone, setPhone] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Telefone fake só é gerado no cliente (evita mismatch de hidratação).
  useEffect(() => {
    setPhone(newTestPhone());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  const formattedPhone = useMemo(() => {
    if (phone.length !== 13) return phone;
    return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }, [phone]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending || !phone) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        reply?: string;
        action?: AIAction;
        error?: string;
      };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: body.error ?? 'Erro ao processar a mensagem.',
            error: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: body.reply ?? '(sem resposta)',
            action: body.action,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : String(err),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function newConversation() {
    setMessages([]);
    setInput('');
    setPhone(newTestPhone());
  }

  async function clearHistory() {
    if (!phone || clearing) return;
    setClearing(true);
    try {
      await fetch(`/api/ai/test?phone=${phone}`, { method: 'DELETE' });
      setMessages([]);
      setInput('');
    } catch {
      // silencioso — limpeza é best-effort
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        eyebrow="Configurações"
        title="Testar IA"
        description="Simule uma conversa de paciente sem usar o WhatsApp. A IA responde com as mesmas regras e disponibilidade reais."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearHistory}
              disabled={sending || clearing || messages.length === 0}
            >
              {clearing ? 'Limpando…' : 'Limpar histórico'}
            </Button>
            <Button variant="outline" onClick={newConversation} disabled={sending}>
              Nova conversa
            </Button>
          </div>
        }
      />

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span>Conversa simulada</span>
            <span className="font-mono text-xs font-normal text-muted-foreground">
              paciente {formattedPhone || '…'}
            </span>
          </CardTitle>
          <CardDescription>
            Cada conversa usa um telefone fake. &ldquo;Nova conversa&rdquo; gera
            outro número e zera o histórico que a IA enxerga.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            ref={scrollRef}
            className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4"
          >
            {messages.length === 0 && !sending && (
              <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
                Mande uma mensagem como se fosse um paciente. Tente algo abaixo
                ou escreva o seu.
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={[
                  'flex flex-col gap-1',
                  m.role === 'user' ? 'items-end' : 'items-start',
                ].join(' ')}
              >
                <div
                  className={[
                    'max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : m.error
                        ? 'rounded-bl-sm bg-destructive/10 text-destructive ring-1 ring-destructive/20'
                        : 'rounded-bl-sm bg-card ring-1 ring-border',
                  ].join(' ')}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && m.action && !m.error && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary ring-1 ring-primary/20">
                    {ACTION_LABEL[m.action]}
                  </span>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
                  digitando…
                </div>
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  disabled={sending}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva como o paciente…"
              disabled={sending}
              autoComplete="off"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40">
        <CardContent className="py-4 text-sm text-muted-foreground">
          ⚠️ As ações são <strong>reais</strong>: se a IA marcar ou cancelar, isso
          acontece no banco e aparece na{' '}
          <Link
            href="/agenda"
            className={buttonVariants({ variant: 'link', size: 'sm' }) + ' px-0'}
          >
            agenda
          </Link>
          . Use o telefone fake (prefixo 5500) para não misturar com pacientes
          reais.
        </CardContent>
      </Card>
    </div>
  );
}
