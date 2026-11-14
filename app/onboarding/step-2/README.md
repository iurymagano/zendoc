# app/onboarding/step-2/

Segundo passo do onboarding — perfil do negócio.

## page.tsx

**O que faz:** client component que coleta a área de atuação (Select shadcn),
endereço, tom das respostas da IA (botões toggle) e instruções especiais
(Textarea). Combina com o step 1 (lido de `sessionStorage`) e envia tudo para
`POST /api/onboarding/profile`.

**Notas:**

- A lista traz exemplos de vários ramos (saúde, beleza, aulas, consultoria…); "Outra" abre um campo livre (máx. 60 caracteres, validado também em `POST /api/onboarding/profile`). O valor vai para `professionals.specialty` e entra no prompt da IA ("secretária virtual de <nome>, <área>").
- Se o `sessionStorage` não tiver o step 1, redireciona para `/onboarding/step-1`.
- Após sucesso: limpa storage e redireciona para
  `/configuracoes/disponibilidade?onboarding=1` para o usuário já configurar a
  agenda. Quando essa tela é concluída com a flag `onboarding=1`, vai direto
  para `/dashboard`.
- Botão "Voltar" navega para o step 1 mantendo os dados salvos.
