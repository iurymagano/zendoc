# app/onboarding/

Fluxo de onboarding em 2 passos, executado após o cadastro.

Os dados do passo 1 ficam em `sessionStorage` sob a chave `iazen:onboarding:step1`
até serem enviados junto com o passo 2 para `POST /api/onboarding/profile`.

## layout.tsx

**O que faz:** layout centralizado com `<Logo size="lg">` no topo e um card
`rounded-2xl` com o conteúdo. Fundo `bg-muted/30` + um gradiente radial azul
sutil atrás do card para dar profundidade. Ao pé, mensagem "Leva menos de 2
minutos" em fonte mono.

**Depende de:** `@/components/brand/Logo`.

## page.tsx

**O que faz:** redireciona `/onboarding` → `/onboarding/step-1`.

## step-1/page.tsx

**O que faz:** coleta nome completo e WhatsApp, valida, normaliza o telefone
(`5511999999999`, sempre com DDI 55) e salva em `sessionStorage`.

**Notas:** WhatsApp com máscara `(11) 99999-9999` (`MaskedInput`); validação: nome
≥ 2 chars e telefone válido por `normalizePhoneBR`/`isValidPhoneBR` (o DDD 55 não é
confundido com o DDI). Não envia ao backend — só armazena local (telefone já
normalizado; ao voltar, é reformatado no campo).

## step-2/page.tsx

**O que faz:** coleta a área de atuação (lista ampla de exemplos + "Outra" com campo livre), endereço (opcional, por CEP via `AddressFields`), tom (`amigável|formal`)
e instruções especiais. Lê o step 1 do `sessionStorage`, envia tudo para
`POST /api/onboarding/profile` e redireciona para `/dashboard`.

**Notas:** se o step 1 não estiver no storage, redireciona de volta. O endereço
vai como texto único (`Rua X, 123, compl. - Bairro, Cidade/UF, CEP 00000-000`) em
`address`, sem mudar o contrato da API.
