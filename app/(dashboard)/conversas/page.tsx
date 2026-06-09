'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';

type Conversation = {
  phone: string;
  name: string | null;
  last_message: string;
  last_role: string;
  last_at: string;
  ai_paused: boolean;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

type Thread = {
  phone: string;
  name: string | null;
  ai_paused: boolean;
  messages: Message[];
};

function time(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch('/api/conversations');
    if (res.ok) setConversations((await res.json()).conversations ?? []);
    setLoadingList(false);
  }, []);

  const loadThread = useCallback(async (phone: string) => {
    const res = await fetch(`/api/conversations/${encodeURIComponent(phone)}`);
    if (res.ok) setThread(await res.json());
  }, []);

  useEffect(() => {
    void (async () => {
      await loadList();
    })();
  }, [loadList]);

  // Atualiza a conversa aberta a cada 10s (ver mensagens novas durante o handoff).
  // O intervalo é recriado quando `selected` muda, então o closure fica fresco.
  useEffect(() => {
    if (!selected) return;
    void (async () => {
      await loadThread(selected);
    })();
    const interval = setInterval(() => {
      void loadThread(selected);
    }, 10_000);
    return () => clearInterval(interval);
  }, [selected, loadThread]);

  async function togglePause() {
    if (!thread) return;
    const next = !thread.ai_paused;
    const res = await fetch(
      `/api/conversations/${encodeURIComponent(thread.phone)}/pause`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: next }),
      },
    );
    if (res.ok) {
      setThread((t) => (t ? { ...t, ai_paused: next } : t));
      await loadList();
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!thread || !draft.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(
      `/api/conversations/${encodeURIComponent(thread.phone)}/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: draft.trim() }),
      },
    );
    const body = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(body.error ?? 'Falha ao enviar.');
      return;
    }
    setDraft('');
    await loadThread(thread.phone);
    await loadList();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Atendimento"
        title="Conversas"
        description="Acompanhe as conversas do WhatsApp. Pause a IA para assumir um atendimento manualmente."
      />

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Inbox */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {loadingList ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhuma conversa ainda.
              </p>
            ) : (
              <ul className="max-h-[70vh] divide-y overflow-auto">
                {conversations.map((c) => (
                  <li key={c.phone}>
                    <button
                      type="button"
                      onClick={() => setSelected(c.phone)}
                      className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                        selected === c.phone ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {c.name ?? c.phone}
                        </span>
                        {c.ai_paused && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200">
                            IA pausada
                          </span>
                        )}
                      </div>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {c.last_role === 'assistant' ? 'Você/IA: ' : ''}
                        {c.last_message}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="flex min-h-[60vh] flex-col">
          {!thread ? (
            <CardContent className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa.
            </CardContent>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {thread.name ?? thread.phone}
                  </div>
                  <div className="text-xs text-muted-foreground">{thread.phone}</div>
                </div>
                <Button
                  size="sm"
                  variant={thread.ai_paused ? 'default' : 'outline'}
                  onClick={togglePause}
                >
                  {thread.ai_paused ? 'Retomar IA' : 'Assumir conversa'}
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-auto p-4">
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.role === 'assistant'
                        ? 'self-end bg-primary/10 text-foreground'
                        : 'self-start bg-muted text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {time(m.created_at)}
                    </p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={send}
                className="flex flex-col gap-2 border-t border-border p-3"
              >
                {!thread.ai_paused && (
                  <p className="text-xs text-muted-foreground">
                    A IA está ativa nesta conversa. Você pode responder mesmo
                    assim, ou clique em “Assumir conversa” para pausá-la.
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    placeholder="Escreva uma mensagem…"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()}>
                    {sending ? 'Enviando…' : 'Enviar'}
                  </Button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
