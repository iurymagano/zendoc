# app/(dashboard)/configuracoes/testar-ia/

Chat de teste que simula um paciente conversando com a IA — sem precisar do
WhatsApp nem de outra pessoa mandando mensagem.

## page.tsx

**O que faz:** inbox tipo WhatsApp — lista de conversas à esquerda (persistidas),
chat à direita. Você digita como se fosse o paciente; a IA responde pelo mesmo
fluxo de produção (`processWhatsAppMessage`).

**Fluxo:**

1. Ao montar, `GET /api/ai/test` lista as conversas (agrupadas por telefone) e
   restaura a última selecionada (salva em `localStorage`,
   `iazen:testchat:phone`) — então ao sair e voltar, você cai na mesma conversa.
2. Selecionar uma conversa → `GET /api/ai/test?phone=…` carrega as mensagens.
3. Enviar → `POST /api/ai/test` com `{ phone, message }`; mostra o `reply` e joga
   a conversa pro topo da lista. O histórico vive no servidor
   (`conversation_history`) — por isso persiste entre reloads.
4. "Nova conversa" gera um **telefone fake** novo (prefixo `5500`) e abre a
   conversa vazia → você pode ter **várias** ao mesmo tempo.
5. Cada resposta mostra um selo com a **ação** da IA (vindo de `action`).
   Mensagens carregadas do histórico não têm selo (o banco guarda só texto).
6. "Limpar" → `DELETE /api/ai/test?phone=…` apaga a conversa do número atual e
   seleciona a próxima da lista.

**Depende de:**

- `@/components/ui/{button,input,card}`, `@/components/dashboard/PageHeader`
- `GET|POST|DELETE /api/ai/test`

**Notas:**

- **As ações são reais.** Se a IA decidir agendar/cancelar, isso é gravado no
  banco e aparece em `/agenda` — por isso o telefone fake, pra não misturar com
  pacientes reais.
- Respeita `ai_enabled` e o plano do profissional (mesmas checagens do fluxo
  real, exceto a validação de WhatsApp conectado — o teste não envia nada).
- Útil para iterar no prompt/ações da IA gastando só o custo da API (ver
  `AI_MODEL=claude-haiku-4-5` no dev para baratear).
