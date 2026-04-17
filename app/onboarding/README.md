# app/onboarding/

Fluxo de onboarding em 2 passos, executado após o cadastro.

Os dados do passo 1 ficam em `sessionStorage` sob a chave `zendoc:onboarding:step1`
até serem enviados junto com o passo 2 para `POST /api/onboarding/profile`.

## layout.tsx

**O que faz:** layout centralizado (card sobre fundo zinc-50) com o branding
Zendoc, usado pelos dois passos.

## page.tsx

**O que faz:** redireciona `/onboarding` → `/onboarding/step-1`.

## step-1/page.tsx

**O que faz:** coleta nome completo e WhatsApp, valida, normaliza o telefone
(`5511999999999`, sempre com DDI 55) e salva em `sessionStorage`.

**Notas:** validação: nome ≥ 2 chars, telefone 10-13 dígitos. Não envia ao
backend — só armazena local.

## step-2/page.tsx

**O que faz:** coleta especialidade, endereço (opcional), tom (`amigável|formal`)
e instruções especiais. Lê o step 1 do `sessionStorage`, envia tudo para
`POST /api/onboarding/profile` e redireciona para `/dashboard`.

**Notas:** se o step 1 não estiver no storage, redireciona de volta.
