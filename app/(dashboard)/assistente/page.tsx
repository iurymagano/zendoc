'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Check, Send, X } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
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
        title="Assistente"
        description="Converse com a IA para cuidar da sua agenda e dos seus lembretes: marcar, remarcar, cancelar e ser avisado no WhatsApp na hora certa."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          aria-label="Conversa com o assistente"
          className="flex flex-col gap-4 rounded-3xl bg-[var(--ia-void)] p-4 text-[var(--ia-on-void)] sm:p-6"
        >
          <div className="flex items-center gap-3">
            <LogoMark size={32} title={null} />
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold tracking-[-0.02em]">
                Assistente IAzen
              </h2>
              <p className="flex items-center gap-1.5 text-sm text-[var(--ia-on-void-muted)]">
                <span className="ia-spark h-1.5 w-1.5 rounded-full bg-[var(--ia-spark)]" />
                {sending ? 'pensando…' : 'online'}
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            aria-live="polite"
            className="flex h-[440px] flex-col gap-3 overflow-y-auto rounded-2xl bg-[var(--ia-void-1)] p-4"
          >
            {loadingMsgs ? (
              <div className="m-auto text-sm text-[var(--ia-on-void-muted)]">
                Carregando…
              </div>
            ) : messages.length === 0 ? (
              <div className="m-auto flex max-w-sm flex-col items-center gap-4 text-center">
                <span className="relative grid size-20 place-items-center">
                  <span className="ia-spark absolute inset-0 rounded-full bg-[var(--ia-violet)]/20" />
                  <LogoMark size={44} title={null} className="relative" />
                </span>
                <p className="font-display text-lg font-bold tracking-[-0.02em]">
                  O que você precisa hoje?
                </p>
                <p className="text-sm text-[var(--ia-on-void-muted)]">
                  Peça do seu jeito, por exemplo: &ldquo;marca a Maria amanhã às
                  14h&rdquo; ou &ldquo;me lembra de ligar para o contador na
                  sexta às 9h&rdquo;.
                </p>
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
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm',
                      m.role === 'user'
                        ? 'rounded-br-md bg-[var(--ia-violet-action)] text-white'
                        : m.error
                          ? 'rounded-bl-md bg-[var(--destructive-soft)] text-destructive'
                          : 'rounded-bl-md bg-[var(--ia-void-3)] text-[var(--ia-on-void)]',
                    ].join(' ')}
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' &&
                    !m.error &&
                    (m.actions ?? []).map((a, i) => (
                      <span
                        key={`${m.id}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--ia-spark)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--ia-spark)]"
                      >
                        <Check className="size-3" />
                        {a}
                      </span>
                    ))}
                </div>
              ))
            )}

            {sending && (
              <div className="flex justify-start" role="status" aria-label="pensando">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[var(--ia-void-3)] px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="ia-spark h-2 w-2 rounded-full bg-[var(--ia-spark)]"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={sending}
                onClick={() => pickSuggestion(s)}
                className="min-h-9 rounded-full bg-[var(--ia-void-2)] px-3.5 text-sm font-medium text-[var(--ia-on-void)] transition-colors hover:bg-[var(--ia-void-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ia-spark)] disabled:opacity-50"
              >
                {s.label}
              </button>
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
              className="h-11 border-transparent bg-[var(--ia-void-2)] text-[var(--ia-on-void)] placeholder:text-[var(--ia-on-void-muted)]"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Enviar"
              className="size-11"
              disabled={sending || input.trim().length === 0}
            >
              <Send />
            </Button>
          </form>
          <p className="text-xs text-[var(--ia-on-void-muted)]">
            As ações são reais: o que o assistente marcar ou cancelar acontece
            na agenda. Clientes não são avisados automaticamente.
          </p>
        </section>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-[var(--ia-violet-ink)]" />
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
                    className="flex items-start justify-between gap-2 rounded-xl bg-muted p-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{r.text}</p>
                      <p className="tabular text-sm text-muted-foreground">
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
                <span className="text-sm font-semibold text-foreground">
                  Últimos
                </span>
                <ul className="flex flex-col gap-2">
                  {recent.map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="break-words">{r.text}</span>
                      <span className="tabular block text-sm text-muted-foreground">
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
