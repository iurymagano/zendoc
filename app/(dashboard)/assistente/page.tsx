'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Check, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatBrDateTime } from '@/lib/assistant/datetime';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: string[] | null;
  error?: boolean;
};

type ReminderRow = {
  id: string;
  text: string;
  remind_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  error_message: string | null;
};

// `send: true` envia na hora; `false` só preenche o campo (pedido incompleto).
const SUGGESTIONS: { label: string; text: string; send: boolean }[] = [
  { label: 'O que tenho amanhã?', text: 'O que tenho amanhã?', send: true },
  {
    label: 'Horários livres esta semana',
    text: 'Quais horários livres eu tenho esta semana?',
    send: true,
  },
  { label: 'Me lembra de…', text: 'Me lembra de ', send: false },
  { label: 'Marca um atendimento…', text: 'Marca um atendimento com ', send: false },
];

export default function AssistentePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<ReminderRow[]>([]);
  const [recent, setRecent] = useState<ReminderRow[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/assistant/reminders');
      if (!res.ok) throw new Error();
      const body = (await res.json()) as {
        pending?: ReminderRow[];
        recent?: ReminderRow[];
      };
      setPending(body.pending ?? []);
      setRecent(body.recent ?? []);
      setReminderError(null);
    } catch {
      setReminderError('Não consegui carregar os lembretes.');
    } finally {
      setLoadingReminders(false);
    }
  }, []);

  // Histórico do chat + lembretes ao abrir a página.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadReminders();
      try {
        const res = await fetch('/api/assistant/messages');
        if (res.ok && !cancelled) {
          const body = (await res.json()) as {
            messages?: {
              id: string;
              role: 'user' | 'assistant';
              content: string;
              actions: string[] | null;
            }[];
          };
          setMessages(body.messages ?? []);
        }
      } catch {
        /* sem histórico: começa vazio */
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadReminders]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: message },
    ]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        reply?: string;
        actions?: string[];
        error?: string;
      };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: body.error ?? 'Não consegui responder agora. Tente de novo.',
            error: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: body.reply ?? '(sem resposta)',
            actions: body.actions ?? [],
          },
        ]);
        // Um lembrete pode ter sido criado/cancelado neste turno.
        void loadReminders();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sem conexão com o servidor. Tente de novo.',
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

  function pickSuggestion(s: (typeof SUGGESTIONS)[number]) {
    if (s.send) {
      void send(s.text);
    } else {
      setInput(s.text);
      inputRef.current?.focus();
    }
  }

  async function cancelReminder(id: string) {
    setCancelingId(id);
    try {
      const res = await fetch(`/api/assistant/reminders/${id}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setReminderError(body.error ?? 'Não consegui cancelar o lembrete.');
      }
    } catch {
      setReminderError('Não consegui cancelar o lembrete.');
    } finally {
      setCancelingId(null);
      void loadReminders();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assistente pessoal"
        title="Assistente"
        description="Converse com a IA para cuidar da sua agenda e dos seus lembretes: marcar, remarcar, cancelar e ser avisado no WhatsApp na hora certa."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Chat
            </CardTitle>
            <CardDescription>
              As ações são reais: o que o assistente marcar ou cancelar acontece
              na agenda. Clientes não são avisados automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div
              ref={scrollRef}
              aria-live="polite"
              className="flex h-[440px] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4"
            >
              {loadingMsgs ? (
                <div className="m-auto text-sm text-muted-foreground">
                  Carregando…
                </div>
              ) : messages.length === 0 ? (
                <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
                  Peça do seu jeito, por exemplo: &ldquo;marca a Maria amanhã às
                  14h&rdquo; ou &ldquo;me lembra de ligar para o contador na
                  sexta às 9h&rdquo;.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      'flex flex-col gap-1',
                      m.role === 'user' ? 'items-end' : 'items-start',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
                        m.role === 'user'
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : m.error
                            ? 'rounded-bl-sm bg-destructive/10 text-destructive ring-1 ring-destructive/20'
                            : 'rounded-bl-sm bg-card ring-1 ring-border',
                      ].join(' ')}
                    >
                      {m.content}
                    </div>
                    {m.role === 'assistant' &&
                      !m.error &&
                      (m.actions ?? []).map((a, i) => (
                        <span
                          key={`${m.id}-${i}`}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary ring-1 ring-primary/20"
                        >
                          <Check className="size-3" />
                          {a}
                        </span>
                      ))}
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
                    pensando…
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s.label}
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={sending}
                  onClick={() => pickSuggestion(s)}
                >
                  {s.label}
                </Button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva o que você precisa…"
                aria-label="Mensagem para o assistente"
                maxLength={2000}
                disabled={sending}
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Enviar"
                disabled={sending || input.trim().length === 0}
              >
                <Send />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" />
              Lembretes
            </CardTitle>
            <CardDescription>
              Chegam no seu WhatsApp (o número do seu perfil) na hora marcada.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {reminderError && (
              <p role="alert" className="text-sm text-destructive">
                {reminderError}
              </p>
            )}

            {loadingReminders ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : pending.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Nenhum lembrete pendente"
                description={'Peça no chat: "me lembra de renovar o contrato dia 20 às 10h".'}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{r.text}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatBrDateTime(r.remind_at)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Cancelar lembrete: ${r.text}`}
                      disabled={cancelingId === r.id}
                      onClick={() => void cancelReminder(r.id)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {recent.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Últimos
                </span>
                <ul className="flex flex-col gap-2">
                  {recent.map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="break-words">{r.text}</span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {formatBrDateTime(r.remind_at)} ·{' '}
                        {r.status === 'sent' ? 'enviado' : 'falhou'}
                      </span>
                      {r.status === 'failed' && r.error_message && (
                        <span className="block text-xs text-destructive">
                          {r.error_message}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
