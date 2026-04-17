# app/onboarding/step-1/

Primeiro passo do onboarding — dados pessoais.

## page.tsx

**O que faz:** client component com formulário de nome + WhatsApp. Salva em
`sessionStorage` e redireciona para `/onboarding/step-2`.

**Notas:**

- Normaliza o telefone para o formato `5511999999999` (DDI 55, sem símbolos).
- Recupera valores previamente digitados ao montar (caso o usuário volte do step 2).
