# app/(dashboard)/configuracoes/testar-ia/

Chat de teste que simula um paciente conversando com a IA — sem precisar do
WhatsApp nem de outra pessoa mandando mensagem.

## page.tsx

**O que faz:** client component com uma interface de chat. Você digita como se
fosse o paciente; a IA responde usando o mesmo fluxo de produção
(`processWhatsAppMessage`) — perfil, regras e disponibilidade reais.

**Fluxo:**

1. Ao montar, gera um **telefone fake** (prefixo `5500`) só no cliente.
2. Cada envio faz `POST /api/ai/test` com `{ phone, message }` e exibe o
   `reply`. O endpoint é autenticado por sessão (cookie vai junto).
3. O histórico/contexto é mantido **no servidor** por telefone
   (`conversation_history`, últimas 10) — o cliente só exibe.
4. "Nova conversa" gera outro telefone fake e zera a tela → contexto limpo.
5. Cada resposta mostra um selo com a **ação** da IA (agendou / cancelou /
   ofereceu horários / respondeu / aguardando aprovação), vindo do `action`
   no payload do `/api/ai/test`.
6. "Limpar histórico" faz `DELETE /api/ai/test?phone=…` — apaga o
   `conversation_history` do número atual (mantém o mesmo telefone).

**Depende de:**

- `@/components/ui/{button,input,card}`, `@/components/dashboard/PageHeader`
- `POST /api/ai/test`

**Notas:**

- **As ações são reais.** Se a IA decidir agendar/cancelar, isso é gravado no
  banco e aparece em `/agenda` — por isso o telefone fake, pra não misturar com
  pacientes reais.
- Respeita `ai_enabled` e o plano do profissional (mesmas checagens do fluxo
  real, exceto a validação de WhatsApp conectado — o teste não envia nada).
- Útil para iterar no prompt/ações da IA gastando só o custo da API (ver
  `AI_MODEL=claude-haiku-4-5` no dev para baratear).
