# lib/ai/

Integração com a API da Anthropic (Claude) — orquestra o fluxo de mensagens do
WhatsApp: histórico → prompt → resposta → ação no banco.

Será implementada na Sprint 2. Arquivos previstos (especificados em `CLAUDE.md`):

- `prompt-builder.ts` — `buildSystemPrompt(professional, availableSlots)`
- `processor.ts` — `processWhatsAppMessage(professional, phone, message)`
- `executor.ts` — `executeAction(professional, phone, response)`
