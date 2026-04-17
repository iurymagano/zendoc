# app/onboarding/step-2/

Segundo passo do onboarding — perfil do consultório.

## page.tsx

**O que faz:** client component que coleta especialidade (Select shadcn),
endereço, tom das respostas da IA (botões toggle) e instruções especiais
(Textarea). Combina com o step 1 (lido de `sessionStorage`) e envia tudo para
`POST /api/onboarding/profile`.

**Notas:**

- Se o `sessionStorage` não tiver o step 1, redireciona para `/onboarding/step-1`.
- Após sucesso: limpa storage e redireciona para
  `/configuracoes/disponibilidade?onboarding=1` para o usuário já configurar a
  agenda. Quando essa tela é concluída com a flag `onboarding=1`, vai direto
  para `/dashboard`.
- Botão "Voltar" navega para o step 1 mantendo os dados salvos.
