# app/(dashboard)/conversas/

## page.tsx

**O que faz:** caixa de conversas do WhatsApp (inbox + thread) com **handoff** —
pausar a IA num contato para o profissional assumir.

**Fluxo:**

- Inbox: `GET /api/conversations` (lista por telefone, com `IA pausada` quando
  aplicável).
- Ao selecionar, abre a thread: `GET /api/conversations/[phone]` (mensagens,
  recarregadas a cada 10s para ver chegadas novas durante o handoff).
- **"Assumir conversa" / "Retomar IA"** → `POST /api/conversations/[phone]/pause`.
- Caixa de envio → `POST /api/conversations/[phone]/send` (manda pelo WhatsApp e
  grava como `assistant`).

**Depende de:** `@/components/ui/{button,textarea,card}`,
`@/components/dashboard/PageHeader`, `/api/conversations/*`.

**Layout:** altura fixa (`h-[72vh]`) com as duas colunas rolando internamente
(`min-h-0` + `overflow-auto`); auto-scroll para a última mensagem.

**Precisa de resposta:** quando a IA escala (`handoff`) ou não entende, a
conversa é marcada (`needs_attention`) — aparece com badge vermelho na inbox
(no topo da lista), um contador no cabeçalho e um aviso na thread. O badge de
total também aparece no item "Conversas" do Navbar (poll 30s,
`/api/conversations/attention-count`). Enviar uma resposta limpa a marcação.

**Notas:** mensagens `assistant` (IA ou profissional) alinhadas à direita; do
paciente à esquerda. Enquanto a IA está ativa, o profissional ainda pode
responder — pausar só impede a resposta automática.
