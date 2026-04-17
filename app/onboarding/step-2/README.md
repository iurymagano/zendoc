# app/onboarding/step-2/

Segundo passo do onboarding — perfil do consultório.

## page.tsx

**O que faz:** client component que coleta especialidade (select pré-definido),
endereço, tom das respostas da IA e instruções especiais. Combina com o step 1
(lido de `sessionStorage`) e envia tudo para `POST /api/onboarding/profile`.

**Notas:**

- Se o `sessionStorage` não tiver o step 1, redireciona para `/onboarding/step-1`.
- Após sucesso: limpa storage e redireciona para `/dashboard`.
- Botão "Voltar" navega para o step 1 mantendo os dados salvos.
