'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
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

type Conversation = {
  phone: string;
  last: string;
  lastRole: string;
  lastAt: string;
  count: number;
};

const ACTION_LABEL: Record<AIAction, string> = {
  book: '✅ agendou',
  confirm: '👍 confirmou presença',
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
];

const STORAGE_KEY = 'iazen:testchat:phone';

/** Telefone fake claramente identificável (prefixo 5500). */
function newTestPhone(): string {
  const rand = Math.floor(Math.random() * 1_0000_0000)
    .toString()
    .padStart(8, '0');
  return `5500${rand}`;
}

/** Rótulo curto e amigável para a lista de conversas. */
function shortLabel(phone: string): string {
  const id = phone.split('@')[0];
  return id.startsWith('5500') ? `Teste ${id.slice(-4)}` : id;
}

export default function TestarIaPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    const res = await fetch('/api/ai/test');
    if (!res.ok) return [];
    const body = (await res.json().catch(() => ({}))) as {
      conversations?: Conversation[];
    };
    const list = body.conversations ?? [];
    setConversations(list);
    return list;
  }, []);

  // Ao montar: carrega as conversas e restaura a selecionada (localStorage).
  useEffect(() => {
    (async () => {
      const list = await loadConversations();
      const saved =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const pick =
        saved && list.some((c) => c.phone === saved)
          ? saved
          : (list[0]?.phone ?? null);
      if (pick) setSelectedPhone(pick);
    })();
  }, [loadConversations]);

  // Ao trocar de conversa: carrega as mensagens daquele telefone.
  useEffect(() => {
    if (!selectedPhone) {
      setMessages([]);
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, selectedPhone);
    }
    let cancelled = false;
    (async () => {
      setLoadingMsgs(true);
      const res = await fetch(
        `/api/ai/test?phone=${encodeURIComponent(selectedPhone)}`,
      );
      if (cancelled) return;
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          messages?: { role: 'user' | 'assistant'; content: string }[];
        };
        setMessages(
          (body.messages ?? []).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        );
      } else {
        setMessages([]);
      }
      setLoadingMsgs(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPhone]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  function newConversation() {
    const phone = newTestPhone();
    setConversations((prev) => [
      {
        phone,
        last: '',
        lastRole: 'assistant',
        lastAt: new Date().toISOString(),
        count: 0,
      },
      ...prev,
    ]);
    setMessages([]);
    setInput('');
    setSelectedPhone(phone);
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending || !selectedPhone) return;
    const phone = selectedPhone;

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
        // Atualiza a lista: joga a conversa pro topo com a última mensagem.
        setConversations((prev) => {
          const cur = prev.find((c) => c.phone === phone);
          const others = prev.filter((c) => c.phone !== phone);
          return [
            {
              phone,
              last: body.reply ?? message,
              lastRole: 'assistant',
              lastAt: new Date().toISOString(),
              count: (cur?.count ?? 0) + 2,
            },
            ...others,
          ];
        });
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

  async function clearHistory() {
    if (!selectedPhone || sending) return;
    const phone = selectedPhone;
    await fetch(`/api/ai/test?phone=${encodeURIComponent(phone)}`, {
      method: 'DELETE',
    }).catch(() => {});
    const remaining = conversations.filter((c) => c.phone !== phone);
    setConversations(remaining);
    setMessages([]);
    setSelectedPhone(remaining[0]?.phone ?? null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Configurações"
        title="Testar IA"
        description="Simule conversas de paciente sem WhatsApp. Cada conversa fica salva — você pode ter várias e voltar nelas depois."
        actions={
          <Button onClick={newConversation} disabled={sending}>
            Nova conversa
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversas</CardTitle>
          <CardDescription>
            Cada conversa usa um telefone fake e mantém o histórico que a IA
            enxerga. Selecione uma à esquerda ou crie uma nova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
            {/* Lista de conversas */}
            <div className="flex max-h-[460px] flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2 md:max-h-[480px]">
              {conversations.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">
                  Nenhuma conversa ainda. Clique em &ldquo;Nova conversa&rdquo;.
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.phone}
                    type="button"
                    onClick={() => setSelectedPhone(c.phone)}
                    className={[
                      'flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors',
                      c.phone === selectedPhone
                        ? 'bg-primary/10 ring-1 ring-primary/20'
                        : 'hover:bg-accent',
                    ].join(' ')}
                  >
                    <span className="text-sm font-medium">
                      {shortLabel(c.phone)}
                    </span>
                    <span className="w-full truncate text-xs text-muted-foreground">
                      {c.last || 'nova conversa'}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Chat da conversa selecionada */}
            <div className="flex flex-col gap-3">
              <div
                ref={scrollRef}
                className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4"
              >
                {!selectedPhone ? (
                  <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
                    Selecione uma conversa ou clique em &ldquo;Nova
                    conversa&rdquo; para começar.
                  </div>
                ) : loadingMsgs ? (
                  <div className="m-auto text-sm text-muted-foreground">
                    Carregando…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
                    Mande uma mensagem como se fosse o paciente.
                  </div>
                ) : (
                  messages.map((m, i) => (
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
                  ))
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
                      digitando…
                    </div>
                  </div>
                )}
              </div>

              {selectedPhone && messages.length === 0 && !loadingMsgs && (
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
                  disabled={sending || !selectedPhone}
                  autoComplete="off"
                />
                <Button type="submit" disabled={sending || !input.trim() || !selectedPhone}>
                  Enviar
                </Button>
                {selectedPhone && messages.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearHistory}
                    disabled={sending}
                  >
                    Limpar
                  </Button>
                )}
              </form>
            </div>
          </div>
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
          . Use telefones fake (prefixo 5500) para não misturar com pacientes
          reais.
        </CardContent>
      </Card>
    </div>
  );
}
