# lib/conversations/

Estado das conversas do WhatsApp — hoje, o handoff (pausar a IA por contato).

---

## state.ts

**O que faz:** lê/grava se a IA está pausada para um contato (tabela
`conversation_state`, chave `professional_id + patient_phone`).

**Exporta:**

- `isConversationPaused(supabase, professionalId, patientPhone): Promise<boolean>`
  — usado pelo webhook do WhatsApp para decidir se a IA responde.
- `setConversationPaused(supabase, professionalId, patientPhone, paused)` — upsert
  do estado, usado por `POST /api/conversations/[phone]/pause`.

**Depende de:** `@/lib/supabase`.

**Notas:** quando pausada, o webhook (`app/api/whatsapp/webhook`) guarda a
mensagem recebida em `conversation_history` mas não aciona a IA — o profissional
assume pela tela `/conversas`.
