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

**Notas:** mensagens `assistant` (IA ou profissional) alinhadas à direita; do
paciente à esquerda. Enquanto a IA está ativa, o profissional ainda pode
responder — pausar só impede a resposta automática.
